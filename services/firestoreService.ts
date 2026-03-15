import {
    collection,
    addDoc,
    getDocs,
    query,
    where,
    orderBy,
    doc,
    getDoc,
    setDoc,
    Timestamp,
    updateDoc,
    deleteDoc
} from "firebase/firestore";
import { db } from "./firebase";
import { Assignment, StudentSubmission, ProfessorProfile, StudentProfile, SavedAudit } from "../types";

const ASSIGNMENTS_COLLECTION = "assignments";
const SUBMISSIONS_COLLECTION = "submissions";
const PROFESSORS_COLLECTION = "professors";
const STUDENTS_COLLECTION = "students";
const DRAFTS_COLLECTION = "drafts";


// const WORDS = ["STUDY", "AUDIT", "DESIGN", "USER", "PLAN", "HEURISTIC", "UX", "RESEARCH", "TEST", "CHECK", "REVIEW", "FLOW", "BEHAVIOR", "BELIEVE", "ALPHA", "BETA", ];
// const WORDS = [
// "LION","TIGER","PANDA","HORSE","MOUSE","SHEEP","GOOSE","CAMEL","ZEBRA","HYENA",
// "OTTER","KOALA","LEMUR","RHINO","BISON","ELK","MOOSE","DEER","LLAMA","ALPACA",
// "WHALE","SHARK","EAGLE","RAVEN","ROBIN","CROW","DOVE","SWAN","CRANE","HERON",
// "FINCH","OWL","EMU","KIWI","DUCK","GOAT","PIG","DOG","CAT","BAT",
// "SEAL","SQUID","CRAB","CLAM","PERCH","TROUT","SMELT","SKATE","SNAKE","VIPER",
// "COBRA","GECKO","IGUANA","FROG","TOAD","NEWT","MINK","FERRET","SLOTH","TAPIR",
// "OKAPI","HYRAX","AGOUTI","PRAWN","BEE","ANT","MOTH","GNAT","WASP","LORIS",
// "PIKA","YAK","HARE","IBEX","ORCA","LOUSE","MIDGE","SKINK","ANURA"
// ];

const WORDS = [
    "RIVER", "OCEAN", "LAKE", "POND", "SHORE", "WAVE", "TIDE", "REEF",
    "STONE", "ROCK", "CLIFF", "SAND", "DUNE", "CAVE", "PEAK", "RIDGE", "PLAIN", "FIELD",
    "GRASS", "LEAF", "MOSS", "FERN", "BLOOM", "BUD", "SEED", "VINE", "ROOT", "BARK",
    "FLORA", "FAUNA", "HERB", "TREE", "WOOD", "GROVE", "BRUSH", "WEED", "THORN",
    "CLOUD", "STORM", "RAIN", "WIND", "MIST", "SNOW", "FROST",
    "EMBER", "FLAME", "GLOW", "SPARK", "DUST", "SHADE", "LIGHT", "AUROR"
];

const generateUniqueCode = () => {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const randomWord = WORDS[Math.floor(Math.random() * WORDS.length)];
    return `${randomNum}-${randomWord}`;
};

/**
 * Recursively removes undefined values from an object to prevent Firestore errors
 */
const cleanObject = (obj: any): any => {
    if (Array.isArray(obj)) {
        return obj.map(cleanObject);
    } else if (obj !== null && typeof obj === 'object') {
        return Object.entries(obj).reduce((acc: any, [key, value]) => {
            if (value !== undefined) {
                acc[key] = cleanObject(value);
            }
            return acc;
        }, {});
    }
    return obj;
};

/**
 * Creates a new assignment in Firestore
 */
export const createAssignment = async (assignment: Omit<Assignment, "id" | "createdAt" | "code">) => {
    const newAssignment = {
        ...assignment,
        code: generateUniqueCode(),
        createdAt: Date.now(),
        status: "active" as const
    };
    const cleaned = cleanObject(newAssignment);
    const docRef = await addDoc(collection(db, ASSIGNMENTS_COLLECTION), cleaned);
    return { id: docRef.id, ...cleaned };
};

/**
 * Fetches an assignment by its unique code
 */
export const getAssignmentByCode = async (code: string): Promise<Assignment | null> => {
    const q = query(
        collection(db, ASSIGNMENTS_COLLECTION),
        where("code", "==", code.toUpperCase())
    );
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) return null;
    const doc = querySnapshot.docs[0];
    return { id: doc.id, ...doc.data() } as Assignment;
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
    const data = cleanObject({
        ...submission,
        timestamp: Date.now()
    });
    const docRef = await addDoc(collection(db, SUBMISSIONS_COLLECTION), data);
    return { id: docRef.id, ...data };
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

/**
 * Fetches a professor's profile by UID
 */
export const getProfessorProfile = async (uid: string): Promise<ProfessorProfile | null> => {
    const docRef = doc(db, PROFESSORS_COLLECTION, uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return { uid: docSnap.id, ...docSnap.data() } as ProfessorProfile;
    }
    return null;
};

/**
 * Updates or creates a professor's profile
 */
export const updateProfessorProfile = async (profile: ProfessorProfile) => {
    const cleaned = cleanObject({
        ...profile,
        updatedAt: Date.now()
    });
    const docRef = doc(db, PROFESSORS_COLLECTION, profile.uid);
    await setDoc(docRef, cleaned, { merge: true });
    return cleaned;
};

/**
 * Fetches a student's profile by UID
 */
export const getStudentProfile = async (uid: string): Promise<StudentProfile | null> => {
    const docRef = doc(db, STUDENTS_COLLECTION, uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return { uid: docSnap.id, ...docSnap.data() } as StudentProfile;
    }
    return null;
};

/**
 * Updates or creates a student's profile
 */
export const updateStudentProfile = async (profile: StudentProfile) => {
    const cleaned = cleanObject({
        ...profile,
        updatedAt: Date.now()
    });
    const docRef = doc(db, STUDENTS_COLLECTION, profile.uid);
    await setDoc(docRef, cleaned, { merge: true });
    return cleaned;
};

/**
 * Saves a draft audit to Firestore
 */
export const saveDraft = async (uid: string, draft: Omit<SavedAudit, "id"> & { id?: string }) => {
    const data = cleanObject({
        ...draft,
        uid,
        updatedAt: Date.now()
    });
    
    if (draft.id) {
        const docRef = doc(db, DRAFTS_COLLECTION, draft.id);
        await setDoc(docRef, data, { merge: true });
        return { id: draft.id, ...data };
    } else {
        const docRef = await addDoc(collection(db, DRAFTS_COLLECTION), data);
        return { id: docRef.id, ...data };
    }
};

/**
 * Fetches all drafts for a student
 */
export const getDrafts = async (uid: string): Promise<SavedAudit[]> => {
    const q = query(
        collection(db, DRAFTS_COLLECTION),
        where("uid", "==", uid)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    } as SavedAudit)).sort((a, b) => b.timestamp - a.timestamp);
};

/**
 * Deletes a draft from Firestore
 */
export const deleteDraft = async (id: string) => {
    const docRef = doc(db, DRAFTS_COLLECTION, id);
    await deleteDoc(docRef);
};

/**
 * Fetches all submissions by a student
 */
export const getSubmissionsByStudent = async (studentUid: string): Promise<StudentSubmission[]> => {
    const q = query(
        collection(db, SUBMISSIONS_COLLECTION),
        where("studentUid", "==", studentUid)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    } as StudentSubmission)).sort((a, b) => b.timestamp - a.timestamp);
};

