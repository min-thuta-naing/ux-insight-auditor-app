import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AssignmentManagement } from '../components/AssignmentManagement';

interface ProfessorAssignmentsPageProps {
    professorId: string;
    onSelectAssignment: (id: string) => void;
}

export const ProfessorAssignmentsPage: React.FC<ProfessorAssignmentsPageProps> = ({
    professorId,
    onSelectAssignment
}) => {
    const navigate = useNavigate();

    const handleSelect = (id: string) => {
        onSelectAssignment(id);
        navigate('/instructor-auth-research-2026/portal/dashboard');
    };

    return (
        <AssignmentManagement
            professorId={professorId}
            onSelectAssignment={handleSelect}
        />
    );
};
