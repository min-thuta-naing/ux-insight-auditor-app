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
    deleteDoc,
    limit,
    onSnapshot
} from "firebase/firestore";
import { db } from "./firebase";
import { Assignment, StudentSubmission, ProfessorProfile, StudentProfile, SavedAudit, UserManagementItem } from "../types";

const ASSIGNMENTS_COLLECTION = "assignments";
const SUBMISSIONS_COLLECTION = "submissions";
const PROFESSORS_COLLECTION = "professors";
const STUDENTS_COLLECTION = "students";
const DRAFTS_COLLECTION = "drafts";
const AUDIT_USAGE_COLLECTION = "audit_usage";


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
    "GRASS", "LEAF", "MOSS", "FERN", "BLOOM", "BUD", "SEED", "VINE", "ROOT", 
    "FLORA", "FAUNA", "HERB", "TREE", "WOOD", "GROVE", "BRUSH", "THORN",
    "CLOUD", "STORM", "RAIN", "WIND", "MIST", "SNOW", "FROST",
    "EMBER", "FLAME", "GLOW", "SPARK", "DUST", "SHADE", "LIGHT", "AURORA"
];

const generateUniqueCode = () => {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const randomWord = WORDS[Math.floor(Math.random() * WORDS.length)];
    return `${randomNum}-${randomWord}`;
};

const generateSessionCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
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
        status: "active" as const,
        roundsCount: 1,
        currentRound: 1,
        roundStatus: "open" as const,
        roundStatuses: { "1": "open" as const },
        roundMaxAudits: { "1": 2 }
    };
    const cleaned = cleanObject(newAssignment);
    const docRef = await addDoc(collection(db, ASSIGNMENTS_COLLECTION), cleaned);
    return { id: docRef.id, ...cleaned };
};

/**
 * Fetches an assignment by its unique code
 */
export const getAssignmentByCode = async (code: string): Promise<Assignment | null> => {
    let normalized = code.trim().toUpperCase();

    // Help students who confuse zero '0' with letter 'O' in the word part
    if (normalized.includes('-')) {
        const [numPart, wordPart] = normalized.split('-');
        if (wordPart) {
            normalized = `${numPart}-${wordPart.replace(/0/g, 'O')}`;
        }
    }

    const q = query(
        collection(db, ASSIGNMENTS_COLLECTION),
        where("code", "==", normalized)
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
 * Updates the round status of an assignment
 */
export const updateRoundStatus = async (assignmentId: string, roundNumber: number, status: 'open' | 'closed') => {
    const docRef = doc(db, ASSIGNMENTS_COLLECTION, assignmentId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return;

    const data = docSnap.data() as Assignment;
    const statuses = data.roundStatuses || {};
    statuses[roundNumber.toString()] = status;

    const updates: any = { roundStatuses: statuses };

    // For backward compatibility and convenience if it's the latest round
    if (roundNumber === data.roundsCount) {
        updates.roundStatus = status;
    }

    await updateDoc(docRef, updates);
};

/**
 * Updates the max audits allowed for a specific round
 */
export const updateRoundMaxAudits = async (assignmentId: string, roundNumber: number, maxAudits: number) => {
    const docRef = doc(db, ASSIGNMENTS_COLLECTION, assignmentId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return;

    const data = docSnap.data() as Assignment;
    const roundMaxAudits = data.roundMaxAudits || {};
    roundMaxAudits[roundNumber.toString()] = maxAudits;

    await updateDoc(docRef, { roundMaxAudits });
};

/**
 * Updates the max submissions allowed for a specific student in a specific round
 */
export const updateStudentMaxSubmissions = async (assignmentId: string, studentUid: string, roundNumber: number, newMax: number) => {
    const docRef = doc(db, ASSIGNMENTS_COLLECTION, assignmentId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return;

    const data = docSnap.data() as Assignment;
    const studentMaxSubmissions = data.studentMaxSubmissions || {};
    if (!studentMaxSubmissions[studentUid]) {
        studentMaxSubmissions[studentUid] = {};
    }
    studentMaxSubmissions[studentUid][roundNumber.toString()] = newMax;

    await updateDoc(docRef, { studentMaxSubmissions });
};

/**
 * Adds a new round to an assignment and sets it as the current active round
 */
export const addNewRound = async (assignmentId: string) => {
    const docRef = doc(db, ASSIGNMENTS_COLLECTION, assignmentId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return;

    const data = docSnap.data() as Assignment;
    const nextRound = (data.roundsCount || 1) + 1;
    const statuses = data.roundStatuses || {};
    statuses[nextRound.toString()] = "open";

    await updateDoc(docRef, {
        roundsCount: nextRound,
        currentRound: nextRound,
        roundStatus: "open",
        roundStatuses: statuses,
        roundMaxAudits: { ...(data.roundMaxAudits || {}), [nextRound.toString()]: 2 }
    });
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

/**
 * Fetches the most recent submission for a student in a specific assignment
 */
export const getLatestSubmission = async (studentUid: string, assignmentId: string): Promise<StudentSubmission | null> => {
    const submissions = await getSubmissionsByStudent(studentUid);
    // Find the newest submission for this specific assignment
    // Since getSubmissionsByStudent already sorts by timestamp desc, we just find the first match
    return submissions.find(s => s.assignmentId === assignmentId) || null;
};

/**
 * Fetches the audit usage count for a student in a specific round of an assignment
 */
export const getAuditUsage = async (studentUid: string, assignmentId: string, roundNumber: number): Promise<number> => {
    const docId = `${studentUid}_${assignmentId}_${roundNumber}`;
    const docRef = doc(db, AUDIT_USAGE_COLLECTION, docId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return docSnap.data().count || 0;
    }
    return 0;
};

/**
 * Increments the audit usage count for a student in a specific round of an assignment
 */
export const incrementAuditUsage = async (studentUid: string, assignmentId: string, roundNumber: number) => {
    const docId = `${studentUid}_${assignmentId}_${roundNumber}`;
    const docRef = doc(db, AUDIT_USAGE_COLLECTION, docId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
        const currentCount = docSnap.data().count || 0;
        await updateDoc(docRef, { count: currentCount + 1, updatedAt: Date.now() });
    } else {
        await setDoc(docRef, {
            studentUid,
            assignmentId,
            roundNumber,
            count: 1,
            updatedAt: Date.now()
        });
    }
};

/**
 * Subscribes to submissions for a specific assignment in real-time
 */
export const subscribeToSubmissions = (assignmentId: string, callback: (submissions: StudentSubmission[]) => void) => {
    const q = query(
        collection(db, SUBMISSIONS_COLLECTION),
        where("assignmentId", "==", assignmentId)
    );
    
    return onSnapshot(q, (snapshot) => {
        const submissions = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as StudentSubmission));
        
        // Sort in-memory to avoid composite index requirement
        const sorted = submissions.sort((a, b) => b.timestamp - a.timestamp);
        callback(sorted);
    });
};

/**
 * Subscribes to an assignment in real-time
 */
export const subscribeToAssignment = (assignmentId: string, callback: (assignment: Assignment | null) => void) => {
    const docRef = doc(db, ASSIGNMENTS_COLLECTION, assignmentId);
    
    return onSnapshot(docRef, (snapshot) => {
        if (snapshot.exists()) {
            callback({ id: snapshot.id, ...snapshot.data() } as Assignment);
        } else {
            callback(null);
        }
    });
};

/**
 * Tests the Firestore connection by attempting to read a single document from a collection
 */
export const testFirestoreConnection = async (): Promise<boolean> => {
    try {
        const q = query(collection(db, ASSIGNMENTS_COLLECTION), limit(1));
        await getDocs(q);
        return true;
    } catch (error) {
        console.error("Firestore Connection Test Failed:", error);
        return false;
    }
};

/**
 * Fetches all users (students and professors) for the management dashboard
 */
export const getAllUsers = async (): Promise<UserManagementItem[]> => {
    const studentsSnap = await getDocs(collection(db, STUDENTS_COLLECTION));
    const professorsSnap = await getDocs(collection(db, PROFESSORS_COLLECTION));
    
    const students = studentsSnap.docs.map(doc => ({
        uid: doc.id,
        email: doc.data().email || '',
        firstName: doc.data().firstName || '',
        lastName: doc.data().lastName || '',
        studentId: doc.data().studentId || '',
        role: 'student' as const
    }));

    const professors = professorsSnap.docs.map(doc => ({
        uid: doc.id,
        email: doc.data().email || '',
        firstName: doc.data().firstName || '',
        lastName: doc.data().lastName || '',
        role: 'professor' as const
    }));

    return [...professors, ...students];
};

/**
 * Deletes a user profile document from the corresponding collection based on role.
 * Does not delete the Firebase Auth user entirely, just the profile data from Firestore.
 */
export const deleteUserProfile = async (uid: string, role: string) => {
    const collectionName = role === 'professor' ? PROFESSORS_COLLECTION : STUDENTS_COLLECTION;
    const docRef = doc(db, collectionName, uid);
    await deleteDoc(docRef);
};
