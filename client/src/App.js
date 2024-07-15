import React, { useState } from "react";
import './App.css';
import Axios from "axios";

const App = () => {
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [fileName, setFileName] = useState("Select Files");
  const [message, setMessage] = useState("");
  const [buttonColor, setButtonColor] = useState("");
  const [file, setFile] = useState(null);
  const [previewLink, setPreviewLink] = useState("");

  const handleFileChange = (event) => {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      setFile(file);
      setFileName(file.name);
    } else {
      setFileName('Select Files');
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setButtonColor('red');
    const formData = new FormData();
    formData.append('name', name);
    formData.append('age', age);
    formData.append('gender', gender);
    formData.append('file', file);

    try {
      
      const response = await Axios.post('http://localhost:3001/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const url = response.data.fileUrl; 
      setPreviewLink(url);

      setMessage('Successfully uploaded to drive and saved in backend');
      setButtonColor('green');
      setName("");
      setAge("");
      setGender("");
      setFileName("Select Files");
      setFile(null);

      setTimeout(() => {
        setMessage('');
        setButtonColor('');
        setPreviewLink('');
      }, 5000);
    } catch (err) {
      setMessage('Not uploaded to drive or backend');
      console.log("Couldn't upload to drive or backend", err);
    }
  };

  return (
    <div className="App">
      <div>
        <h2>Enter Student details:</h2><br />
        <p>{message}</p>
        <form onSubmit={handleSubmit}>
          <input type="text" placeholder="Name.." value={name} onChange={(event) => setName(event.target.value)} /><br/>
          <input type="number" placeholder="Age.." value={age} onChange={(event) => setAge(event.target.value)} /><br/>
          <input type="text" placeholder="Gender.." value={gender} onChange={(event) => setGender(event.target.value)} /><br/>
          <input type="file" id="fileInput" onChange={handleFileChange} /><br/>
          <label htmlFor="fileInput">{fileName}</label><br/>
          {previewLink && <p><a href={previewLink} target="_blank" rel="noopener noreferrer">Preview Link</a></p>}
          <button type="submit" id="myButton" style={{ backgroundColor: buttonColor }}>Submit</button>
        </form>
      </div>
    </div>
  );
}

export default App;
