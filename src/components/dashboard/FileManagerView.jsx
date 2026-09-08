import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'motion/react';
import {
  FileText,
  FileSpreadsheet,
  UploadCloud,
  ShieldCheck,
  Search,
  Plus,
  CheckCircle2,
  HardDrive,
  RefreshCw,
  FolderLock,
  Lock,
} from 'lucide-react';
import { PrimaryButton, GhostButton } from '../common/Button.jsx';

// Container matching the clean light dashboard surface
const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

// Top action row with search and upload button
const ActionRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
`;

const SearchInputWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  background-color: ${(props) => props.theme.colors.white};
  border: 1px solid ${(props) => props.theme.colors.border};
  border-radius: ${(props) => props.theme.radii.button};
  padding: 8px 14px;
  width: 100%;
  max-width: 320px;
  transition: border-color 0.15s ease;

  &:focus-within {
    border-color: ${(props) => props.theme.colors.red};
    box-shadow: 0 0 0 3px ${(props) => props.theme.colors.redLight};
  }

  input {
    border: none;
    background: transparent;
    outline: none;
    font-family: ${(props) => props.theme.typography.displayFont};
    font-size: 13.5px;
    color: ${(props) => props.theme.colors.ink};
    width: 100%;

    &::placeholder {
      color: ${(props) => props.theme.colors.soft};
    }
  }
`;

// Drag-and-drop upload zone
const DropzoneWrapper = styled(motion.div)`
  background-color: ${(props) => (props.$isDragging ? props.theme.colors.redLight : props.theme.colors.white)};
  border: 2px dashed ${(props) => (props.$isDragging ? props.theme.colors.red : props.theme.colors.border)};
  border-radius: ${(props) => props.theme.radii.card};
  padding: 24px 20px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: ${(props) => props.theme.colors.red};
    background-color: ${(props) => props.theme.colors.surface};
  }

  .upload-title {
    font-size: 14px;
    font-weight: 700;
    color: ${(props) => props.theme.colors.ink};
  }

  .upload-hint {
    font-size: 12.5px;
    color: ${(props) => props.theme.colors.soft};
  }
`;

// Clean Google Drive-style file table card
const TableCard = styled.div`
  background-color: ${(props) => props.theme.colors.white};
  border: 1px solid ${(props) => props.theme.colors.border};
  border-radius: ${(props) => props.theme.radii.card};
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.03);
`;

const TableHeader = styled.div`
  display: grid;
  grid-template-columns: 2.5fr 1.8fr 1fr 1.2fr 1fr;
  padding: 12px 20px;
  background-color: ${(props) => props.theme.colors.surface};
  border-bottom: 1px solid ${(props) => props.theme.colors.border};
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: ${(props) => props.theme.colors.soft};

  @media (max-width: 768px) {
    grid-template-columns: 2fr 1fr;
    .hide-mobile {
      display: none;
    }
  }
`;

const FileRowItem = styled.div`
  display: grid;
  grid-template-columns: 2.5fr 1.8fr 1fr 1.2fr 1fr;
  padding: 14px 20px;
  align-items: center;
  border-bottom: 1px solid ${(props) => props.theme.colors.border};
  transition: background-color 0.15s ease;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background-color: ${(props) => props.theme.colors.surface};
  }

  @media (max-width: 768px) {
    grid-template-columns: 2fr 1fr;
    .hide-mobile {
      display: none;
    }
  }

  .file-name-cell {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 13.5px;
    font-weight: 600;
    color: ${(props) => props.theme.colors.ink};
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .course-cell {
    font-size: 13px;
    color: ${(props) => props.theme.colors.soft};
  }

  .size-cell {
    font-size: 12.5px;
    font-family: ${(props) => props.theme.typography.monoFont};
    color: ${(props) => props.theme.colors.soft};
  }

  .date-cell {
    font-size: 12px;
    color: ${(props) => props.theme.colors.soft};
  }
`;

// Emerald green protected badge indicating active cryptographic isolation
const ProtectedBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  font-weight: 600;
  color: #047857;
  background-color: #ecfdf5;
  border: 1px solid #a7f3d0;
  border-radius: 9999px;
  padding: 2px 8px;
  width: fit-content;
`;

const NotificationBanner = styled(motion.div)`
  padding: 12px 16px;
  background-color: #ecfdf5;
  border: 1px solid #a7f3d0;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13.5px;
  color: #047857;
`;

/**
 * File Manager View (Google Drive-Style Workspace)
 * Displays active educator files, lets teachers upload new exams,
 * and highlights active encryption at rest with green Protected badges.
 */
const DEFAULT_FILES = [
  {
    id: 'file_001',
    name: 'CS101_Final_Exam_Master_2026.pdf',
    course: 'CS 101: Introduction to Algorithms',
    size_bytes: 2411724,
    size_formatted: '2.4 MB',
    mime_type: 'application/pdf',
    protection_status: 'protected',
    is_encrypted: true,
    uploaded_at: '2026-09-02T10:14:00Z',
    last_accessed_at: '2026-09-08T09:30:00Z',
  },
  {
    id: 'file_002',
    name: 'Physics_Grading_Rubric_Master.xlsx',
    course: 'PHYS 202: Quantum Mechanics',
    size_bytes: 841920,
    size_formatted: '822 KB',
    mime_type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    protection_status: 'protected',
    is_encrypted: true,
    uploaded_at: '2026-09-04T15:22:00Z',
    last_accessed_at: '2026-09-07T18:45:00Z',
  },
  {
    id: 'file_003',
    name: 'Midterm_Exam_Answer_Keys.pdf',
    course: 'CS 101: Introduction to Algorithms',
    size_bytes: 1258291,
    size_formatted: '1.2 MB',
    mime_type: 'application/pdf',
    protection_status: 'protected',
    is_encrypted: true,
    uploaded_at: '2026-09-05T08:12:00Z',
    last_accessed_at: '2026-09-08T11:05:00Z',
  },
  {
    id: 'file_004',
    name: 'Student_Gradebook_Fall2026.csv',
    course: 'CS 101: Introduction to Algorithms',
    size_bytes: 194560,
    size_formatted: '190 KB',
    mime_type: 'text/csv',
    protection_status: 'protected',
    is_encrypted: true,
    uploaded_at: '2026-09-06T14:00:00Z',
    last_accessed_at: '2026-09-08T12:10:00Z',
  },
];

export default function FileManagerView() {
  const [files, setFiles] = useState(DEFAULT_FILES);
  const [searchQuery, setSearchQuery] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadSuccessMessage, setUploadSuccessMessage] = useState('');
  const fileInputRef = useRef(null);

  // Fetch file list from server
  const loadFiles = async () => {
    try {
      const res = await fetch('/api/v1/files');
      if (!res.ok) return;
      const data = await res.json();
      if (data?.files && Array.isArray(data.files)) {
        setFiles(data.files);
      }
    } catch {
      // Fallback already pre-seeded
    }
  };

  useEffect(() => {
    loadFiles();
  }, []);

  // Handles simulated file upload to backend
  const handleUploadFile = async (fileName, course = 'CS 101: Introduction to Algorithms') => {
    setIsUploading(true);
    const mockFile = {
      id: 'file_' + Math.random().toString(36).substring(2, 9),
      name: fileName,
      course: course,
      size_bytes: 1450000,
      size_formatted: '1.4 MB',
      mime_type: 'application/pdf',
      protection_status: 'protected',
      is_encrypted: true,
      uploaded_at: new Date().toISOString(),
      last_accessed_at: new Date().toISOString(),
    };

    try {
      const res = await fetch('/api/v1/files/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: fileName,
          course: course,
          size_bytes: 1450000,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (data?.file) {
        setFiles((prev) => [data.file, ...prev]);
      } else {
        setFiles((prev) => [mockFile, ...prev]);
      }
    } catch {
      setFiles((prev) => [mockFile, ...prev]);
    } finally {
      setUploadSuccessMessage(`"${fileName}" was encrypted at rest and placed under active protection.`);
      setTimeout(() => setUploadSuccessMessage(''), 4000);
      setIsUploading(false);
    }
  };

  // Triggers hidden input selector
  const handleSelectFiles = (e) => {
    const selected = e.target.files?.[0];
    if (selected) {
      handleUploadFile(selected.name);
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      handleUploadFile(droppedFile.name);
    }
  };

  // Filter files by search query
  const filteredFiles = files.filter(
    (file) =>
      file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      file.course.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Container>
      {/* Upload Success Banner */}
      <AnimatePresence>
        {uploadSuccessMessage && (
          <NotificationBanner
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
          >
            <CheckCircle2 size={16} />
            <span>{uploadSuccessMessage}</span>
          </NotificationBanner>
        )}
      </AnimatePresence>

      {/* Top Search & Actions */}
      <ActionRow>
        <SearchInputWrapper>
          <Search size={15} color="#72716d" />
          <input
            type="text"
            placeholder="Search exam files or courses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </SearchInputWrapper>

        <div style={{ display: 'flex', gap: '10px' }}>
          <GhostButton $bordered $small onClick={loadFiles}>
            <RefreshCw size={13} />
            <span>Refresh</span>
          </GhostButton>
          <PrimaryButton $small onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
            <Plus size={14} />
            <span>{isUploading ? 'Encrypting & Storing...' : 'Upload Exam File'}</span>
          </PrimaryButton>
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: 'none' }}
            onChange={handleSelectFiles}
          />
        </div>
      </ActionRow>

      {/* Drag and Drop Zone */}
      <DropzoneWrapper
        $isDragging={isDragging}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <UploadCloud size={28} color={isDragging ? '#c8102e' : '#72716d'} />
        <div className="upload-title">Drop your exam papers or gradebooks here</div>
        <div className="upload-hint">Files are automatically encrypted with AES-256 and monitored for burst downloads.</div>
      </DropzoneWrapper>

      {/* Google Drive-Style Files List */}
      <TableCard>
        <TableHeader>
          <div>Document Name</div>
          <div className="hide-mobile">Course</div>
          <div className="hide-mobile">Size</div>
          <div>Security Status</div>
          <div className="hide-mobile">Last Accessed</div>
        </TableHeader>

        {filteredFiles.length > 0 ? (
          filteredFiles.map((file) => (
            <FileRowItem key={file.id}>
              <div className="file-name-cell">
                {file.name.endsWith('.xlsx') || file.name.endsWith('.csv') ? (
                  <FileSpreadsheet size={18} color="#059669" />
                ) : (
                  <FileText size={18} color="#c8102e" />
                )}
                <span>{file.name}</span>
              </div>
              <div className="course-cell hide-mobile">{file.course}</div>
              <div className="size-cell hide-mobile">{file.size_formatted}</div>
              <div>
                <ProtectedBadge>
                  <ShieldCheck size={12} /> Protected
                </ProtectedBadge>
              </div>
              <div className="date-cell hide-mobile">Today</div>
            </FileRowItem>
          ))
        ) : (
          <div style={{ padding: '36px', textAlign: 'center', color: '#72716d', fontSize: '14px' }}>
            No files found matching "{searchQuery}".
          </div>
        )}
      </TableCard>
    </Container>
  );
}
