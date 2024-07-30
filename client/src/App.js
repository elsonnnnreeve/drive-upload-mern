import React, { useState, useRef, useEffect } from "react";
import './App.css';
import Axios from "axios";
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

const App = () => {
  const [listOfUsers, setListOfUsers] = useState([]);
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [fileName, setFileName] = useState("Upload ID card");
  const [message, setMessage] = useState("");
  const [buttonColor, setButtonColor] = useState("");
  const [file, setFile] = useState(null);
  const [previewLink, setPreviewLink] = useState("");
  const fileInputRef = useRef(null);

  useEffect(() => {
    Axios.get("https://drive-upload-backend.vercel.app/api/getUsers").then((response) => {
      setListOfUsers(response.data);
    });
  }, []);

  const handleFileChange = (event) => {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      setFile(file);
      setFileName('Upload ID card');
    } else {
      setFileName('Upload ID card');
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
      const response = await Axios.post('https://drive-upload-backend.vercel.app/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      });

      const url = response.data.id;
      setPreviewLink(url);
      setListOfUsers([
        ...listOfUsers,
        {
          name,
          age,
          gender,
          id: url,
        },
      ]);

      setMessage('Successfully uploaded to drive and saved in backend');
      setButtonColor('green');
      setName("");
      setAge("");
      setGender("");
      setFileName("Upload ID card");
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = null;
      }

      setTimeout(() => {
        setMessage('');
        setButtonColor('');
      }, 5000);
    } catch (err) {
      if (err.message === "Error uploading file to Drive: Insufficient storage quota on Google Drive. Unable to upload file.") {
        setMessage("File size exceeds storage limit. Please upload a smaller file.")
        console.log("File size exceeds storage limit. Please upload a smaller file.", err.response);
      } else {
        setMessage('Not uploaded to drive or backend');
        console.log("Couldn't upload to drive or backend", err);
      }
      setTimeout(() => {
        setMessage('');
        setButtonColor('');
      }, 5000);
    }
  };

  return (
    <div className="body">
      {message && (
        <div className="position-absolute top-80 start-50 translate-middle-x">
          <div className={`alert ${buttonColor === "green" ? "alert-success" : "alert-danger"} text-center`}>
            {message}
          </div>
        </div>
      )}
      <br /><br />

      <div className="container-sm p-3 my-5 mx-auto border text-center row w-25 rounded custom-layout">
        <h2 className="h2">Enter Student details:</h2><br /><br/><br/><br/>
        <form onSubmit={handleSubmit}>
          <input className="col form-control form-control-sm" type="text" placeholder="Name.." value={name} onChange={(event) => setName(event.target.value)} /><br /><br />
          <input className="col form-control form-control-sm" type="number" placeholder="Age.." value={age} onChange={(event) => setAge(event.target.value)} /><br /><br />
          <select className="col form-select form-select-sm" value={gender} onChange={(event) => setGender(event.target.value)}>
            <option value="">Select Gender..</option>
            <option value="m">Male</option>
            <option value="f">Female</option>
            <option value="o">Other</option>
          </select><br />
          <label className="col" hidden={true} htmlFor="fileInput">{fileName}</label><br/>
          <input className="col text-center form-control form-control-sm" type="file" id="fileInput" onChange={handleFileChange} ref={fileInputRef} multiple /><br />
          <span className={`alert ${buttonColor === "red" ? " spinner-grow text-primary spinner-grow-sm" : ""}`} ></span><br/>
          <button className="btn btn-outline-primary btn-sm" type="submit" id="myButton" style={{ backgroundColor: buttonColor }}>
            Submit
          </button>
        </form>
      </div>

      <span className="text-center">
        {previewLink && <p><a href={previewLink} className="btn btn-info btn-sm" target="_blank" rel="noopener noreferrer">Preview of the recently uploaded file</a></p>}
        <br /><br />
      </span>
      
      <div className="d-flex justify-content-center mt-4">
        <button type="button" className="btn btn-primary" data-bs-toggle="collapse" data-bs-target="#demo">STUDENTS</button>
        <span id="demo" className="collapse">
          <table className="table table-responsive-sm table-bordered text-center table-sm table-hover table-striped table-container">
            <thead className="thead-light">
              <tr>
                <th>Name</th>
                <th>Age</th>
                <th>Gender</th>
              
              </tr>
            </thead>
            <tbody>
              {listOfUsers.map((user, index) => (
                <tr key={index}>
                  <td>{user.name}</td>
                  <td>{user.age}</td>
                  <td>{user.gender}</td>
                  
                </tr>
              ))}
            </tbody>
          </table>
        </span>
      </div>
    </div>
  );
}

export default App;
