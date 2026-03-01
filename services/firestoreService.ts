import {
    collection,
    addDoc,
    getDocs,
    query,
    where,
    orderBy,
    doc,
    getDoc,
    Timestamp,
    updateDoc,
    deleteDoc
} from "firebase/firestore";
import { db } from "./firebase";
import { Assignment, StudentSubmission } from "../types";

const ASSIGNMENTS_COLLECTION = "assignments";
const SUBMISSIONS_COLLECTION = "submissions";

/**
 * Creates a new assignment in Firestore
 */
export const createAssignment = async (assignment: Omit<Assignment, "id" | "createdAt">) => {
    const newAssignment = {
        ...assignment,
        createdAt: Date.now(),
        status: "active" as const
    };
    const docRef = await addDoc(collection(db, ASSIGNMENTS_COLLECTION), newAssignment);
    return { id: docRef.id, ...newAssignment };
};

/**
 * Fetches all assignments for a specific professor
 */
export const getAssignments = async (professorId: string): Promise<Assignment[]> => {
    const q = query(
        collection(db, ASSIGNMENTS_COLLECTION),
        where("professorId", "==", professorId)
    );
    const querySnapshot = await getDocs(q);
    const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    } as Assignment));

    // Sort in-memory to avoid composite index requirement
    return data.sort((a, b) => b.createdAt - a.createdAt);
};

/**
 * Fetches a single assignment by ID
 */
export const getAssignmentById = async (assignmentId: string): Promise<Assignment | null> => {
    const docRef = doc(db, ASSIGNMENTS_COLLECTION, assignmentId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Assignment;
    }
    return null;
};

/**
 * Submits a student's audit to Firestore
 */
export const submitToFirestore = async (submission: Omit<StudentSubmission, "id">) => {
    const docRef = await addDoc(collection(db, SUBMISSIONS_COLLECTION), {
        ...submission,
        timestamp: Date.now()
    });
    return { id: docRef.id, ...submission };
};

/**
 * Fetches all submissions for a specific assignment
 */
export const getSubmissionsByAssignment = async (assignmentId: string): Promise<StudentSubmission[]> => {
    const q = query(
        collection(db, SUBMISSIONS_COLLECTION),
        where("assignmentId", "==", assignmentId)
    );
    const querySnapshot = await getDocs(q);
    const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    } as StudentSubmission));

    // Sort in-memory to avoid composite index requirement
    return data.sort((a, b) => b.timestamp - a.timestamp);
};

/**
 * Deletes an assignment from Firestore
 */
export const deleteAssignment = async (assignmentId: string) => {
    const docRef = doc(db, ASSIGNMENTS_COLLECTION, assignmentId);
    await deleteDoc(docRef);
};
