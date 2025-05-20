import React, { useRef } from 'react';
import { Button } from '@mui/material';

function FileUpload({ onFileUpload }) {
  const fileInputRef = useRef(null);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file && onFileUpload) {
      onFileUpload(file);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current.click();
  };

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        style={{ display: 'none' }} // Hide the default file input
      />
      <Button variant="contained" onClick={handleButtonClick}>
        Select File
      </Button>
    </>
  );
}

export default FileUpload;