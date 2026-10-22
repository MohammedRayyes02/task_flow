import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/config/Firebase";

const VALID_STATUSES = ["todo", "in_progress", "done"];
const VALID_PRIORITIES = ["low", "medium", "high"];

/**
 * Creates a new task within a project.
 */
export async function createTask(
  projectId,
  { title, description = "", status = "todo", priority = "medium", dueDate = null, assigneeId = null, createdBy }
) {
  if (!projectId) throw new Error("Project ID is required.");
  if (!title || title.trim().length < 3 || title.trim().length > 120) {
    throw new Error("Task title must be between 3 and 120 characters.");
  }
  if (!VALID_STATUSES.includes(status)) {
    throw new Error("Invalid task status.");
  }
  if (!VALID_PRIORITIES.includes(priority)) {
    throw new Error("Invalid task priority.");
  }
  if (!createdBy) {
    throw new Error("Task creator ID is required.");
  }

  const tasksCollection = collection(db, "projects", projectId, "tasks");
  const taskRef = doc(tasksCollection);

  const taskData = {
    title: title.trim(),
    description: description ? description.trim() : "",
    status,
    priority,
    dueDate: dueDate || null,
    assigneeId: assigneeId || null,
    createdBy,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await setDoc(taskRef, taskData);
  return { id: taskRef.id, ...taskData };
}

/**
 * Fetches all tasks for a project.
 */
export async function getProjectTasks(projectId) {
  if (!projectId) return [];

  const tasksCollection = collection(db, "projects", projectId, "tasks");
  const snapshot = await getDocs(tasksCollection);

  const tasks = snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
  }));

  // Client-side sort by createdAt descending
  return tasks.sort((a, b) => {
    const timeA = a.createdAt?.seconds || 0;
    const timeB = b.createdAt?.seconds || 0;
    return timeB - timeA;
  });
}

/**
 * Updates a task.
 */
export async function updateTask(projectId, taskId, updates) {
  if (!projectId || !taskId) throw new Error("Project ID and Task ID are required.");

  if (updates.title && (updates.title.trim().length < 3 || updates.title.trim().length > 120)) {
    throw new Error("Task title must be between 3 and 120 characters.");
  }
  if (updates.status && !VALID_STATUSES.includes(updates.status)) {
    throw new Error("Invalid task status.");
  }
  if (updates.priority && !VALID_PRIORITIES.includes(updates.priority)) {
    throw new Error("Invalid task priority.");
  }

  const taskRef = doc(db, "projects", projectId, "tasks", taskId);
  await updateDoc(taskRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Deletes a task.
 */
export async function deleteTask(projectId, taskId) {
  if (!projectId || !taskId) throw new Error("Project ID and Task ID are required.");

  const taskRef = doc(db, "projects", projectId, "tasks", taskId);
  await deleteDoc(taskRef);
}
