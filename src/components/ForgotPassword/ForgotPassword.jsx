import React, {useState} from 'react';
import { Form, Button } from 'react-bootstrap';
import './ForgotPassword.css';
import { sendPasswordResetEmail } from "firebase/auth";
import {auth} from '../../features/firebase/firebase';
import { useNavigate } from 'react-router-dom';

function ForgotPassword() {
    const [email, setEmail] = useState('');
    const navigate = useNavigate();
    const [error, setError] = useState('');

    function handleEmailChange(e) {
        setEmail(e.target.value);
    }

    function handleSubmit(e) {
        e.preventDefault();
        if (email === '') {
            setError('Vui lòng nhập email');
            return;
        }
        else{
            sendPasswordResetEmail(auth, email)
            .then(() => {
                alert('Email đã được gửi');
                navigate('/');
            })
            .catch((error) => {
                alert(error.message);
            });
        }
    }

    function handleReturn(e) {
        e.preventDefault();
        navigate('/');
    }

  return (
    <Form className='container mt-5 forgot-pass'>
      <div className="">
          <h2 className="d-flex justify-content-center mt-5">
            Bạn quên mật khẩu?
          </h2>
          <div className="d-flex justify-content-center greeting-log mb-4">
            Hãy nhập vào email đã đăng ký
          </div>
        </div>
      <Form.Group controlId="formBasicEmail" onChange={handleEmailChange}>
        <Form.Label className="form-label">Địa chỉ mail</Form.Label>
        <Form.Control type="email" placeholder="Nhập email" />
        {error && <p className="error">{error}</p>}
        <Form.Text className="form-text">
            Chúng tôi sẽ gửi cho bạn một email để đặt lại mật khẩu.
        </Form.Text>
      </Form.Group>

      <Button 
      variant="primary" 
      type="submit"
      className='d-block mx-auto mt-3'
      onClick={handleSubmit}
      >
        Gửi
      </Button>

      <div className="d-flex justify-content-center mt-3">
        <a className="text-decoration-none back-login" onClick={handleReturn}>Quay lại đăng nhập</a>
      </div>
    </Form>
  );
}

export default ForgotPassword;
