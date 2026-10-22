import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  arrayUnion,
  arrayRemove,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/config/Firebase";

/**
 * Creates a new project in Firestore.
 */
export async function createProject({ name, description = "", ownerId }) {
  if (!name || name.trim().length < 3 || name.trim().length > 80) {
    throw new Error("Project name must be between 3 and 80 characters.");
  }
  if (!ownerId) {
    throw new Error("Owner ID is required to create a project.");
  }

  const projectRef = doc(collection(db, "projects"));
  const projectData = {
    name: name.trim(),
    description: description.trim(),
    ownerId,
    memberIds: [ownerId],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await setDoc(projectRef, projectData);
  return { id: projectRef.id, ...projectData };
}

/**
 * Fetches all projects where the given user is an owner or member.
 */
export async function getUserProjects(userId) {
  if (!userId) return [];

  const q = query(
    collection(db, "projects"),
    where("memberIds", "array-contains", userId)
  );

  const snapshot = await getDocs(q);
  const projects = snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
  }));

  // Sort descending by createdAt on the client to avoid composite index requirements
  return projects.sort((a, b) => {
    const timeA = a.createdAt?.seconds || 0;
    const timeB = b.createdAt?.seconds || 0;
    return timeB - timeA;
  });
}

/**
 * Fetches single project by ID.
 */
export async function getProjectById(projectId) {
  if (!projectId) return null;

  const docRef = doc(db, "projects", projectId);
  const snapshot = await getDoc(docRef);

  if (!snapshot.exists()) {
    return null;
  }

  return { id: snapshot.id, ...snapshot.data() };
}

/**
 * Updates a project's details (owner only).
 */
export async function updateProject(projectId, { name, description }) {
  if (!projectId) throw new Error("Project ID is required.");
  if (!name || name.trim().length < 3 || name.trim().length > 80) {
    throw new Error("Project name must be between 3 and 80 characters.");
  }

  const projectRef = doc(db, "projects", projectId);
  await updateDoc(projectRef, {
    name: name.trim(),
    description: description ? description.trim() : "",
    updatedAt: serverTimestamp(),
  });
}

/**
 * Deletes a project and cleans up its tasks subcollection (owner only).
 */
export async function deleteProject(projectId) {
  if (!projectId) throw new Error("Project ID is required.");

  // Delete all tasks in the subcollection first
  const tasksRef = collection(db, "projects", projectId, "tasks");
  const tasksSnapshot = await getDocs(tasksRef);
  const deletePromises = tasksSnapshot.docs.map((taskDoc) =>
    deleteDoc(doc(db, "projects", projectId, "tasks", taskDoc.id))
  );
  await Promise.all(deletePromises);

  // Delete the project document itself
  await deleteDoc(doc(db, "projects", projectId));
}

/**
 * Fetches user profile details for a list of member UIDs.
 */
export async function getProjectMembers(memberIds = []) {
  if (!memberIds || memberIds.length === 0) return [];

  const memberPromises = memberIds.map(async (uid) => {
    try {
      const userDoc = await getDoc(doc(db, "users", uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        return {
          id: userDoc.id,
          fullName: data.fullName || "User",
          email: data.email || "",
          role: data.role || "Member",
        };
      }
      return { id: uid, fullName: "Unknown User", email: "", role: "Member" };
    } catch {
      return { id: uid, fullName: "Member", email: "", role: "Member" };
    }
  });

  return Promise.all(memberPromises);
}

/**
 * Adds an existing registered user to a project by their email address.
 */
export async function addProjectMember(projectId, email) {
  if (!projectId) throw new Error("Project ID is required.");
  if (!email || !email.trim()) throw new Error("Email address is required.");

  const targetEmail = email.trim().toLowerCase();

  // 1. Find user by email in users collection
  const usersRef = collection(db, "users");
  const q = query(usersRef, where("email", "==", targetEmail));
  const snapshot = await getDocs(q);

  let targetUser = null;
  if (!snapshot.empty) {
    targetUser = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
  } else {
    // Fallback: check case-insensitive match by searching all users if needed
    const allUsersSnap = await getDocs(usersRef);
    const found = allUsersSnap.docs.find(
      (d) => d.data().email?.toLowerCase() === targetEmail
    );
    if (found) {
      targetUser = { id: found.id, ...found.data() };
    }
  }

  if (!targetUser) {
    throw new Error("No registered account found with this email. Please ask the user to register first.");
  }

  // 2. Check if already a member
  const project = await getProjectById(projectId);
  if (!project) throw new Error("Project not found.");

  if (project.memberIds && project.memberIds.includes(targetUser.id)) {
    throw new Error("This user is already a member of this project.");
  }

  // 3. Add to project memberIds
  const projectRef = doc(db, "projects", projectId);
  await updateDoc(projectRef, {
    memberIds: arrayUnion(targetUser.id),
    updatedAt: serverTimestamp(),
  });

  return {
    id: targetUser.id,
    fullName: targetUser.fullName || targetUser.email?.split("@")[0] || "User",
    email: targetUser.email,
    role: targetUser.role || "Member",
  };
}

/**
 * Removes a member from a project and unassigns their tasks.
 */
export async function removeProjectMember(projectId, memberId, ownerId) {
  if (!projectId || !memberId) throw new Error("Project and Member IDs are required.");

  if (memberId === ownerId) {
    throw new Error("The project owner cannot be removed from the project.");
  }

  // 1. Remove member from project.memberIds
  const projectRef = doc(db, "projects", projectId);
  await updateDoc(projectRef, {
    memberIds: arrayRemove(memberId),
    updatedAt: serverTimestamp(),
  });

  // 2. Unassign tasks assigned to this removed member (per SRS Section 13)
  const tasksRef = collection(db, "projects", projectId, "tasks");
  const q = query(tasksRef, where("assigneeId", "==", memberId));
  const tasksSnapshot = await getDocs(q);

  const unassignPromises = tasksSnapshot.docs.map((tDoc) =>
    updateDoc(doc(db, "projects", projectId, "tasks", tDoc.id), {
      assigneeId: null,
      updatedAt: serverTimestamp(),
    })
  );

  await Promise.all(unassignPromises);
}
