import React, { useState, useEffect } from 'react';

import Button from '@mui/material/Button';
import AddIcon from '@mui/icons-material/Add';
import { TextField } from '@mui/material';
import Box from '@mui/material/Box';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import { DatePicker } from '@mui/x-date-pickers';
import dayjs from 'dayjs';

import { useSelector, useDispatch } from 'react-redux';
import { selectUsers, signout } from '../../features/firebase/firebaseSlice';
import { lang } from '../../features/language/languageSlice';


import {
  updateProfile,
  updateEmail,
  onAuthStateChanged,
  signOut,
  reauthenticateWithCredential,
  sendEmailVerification,
  EmailAuthProvider,
  deleteUser
} from 'firebase/auth';
import { collection, onSnapshot, doc, getDoc, getDocs, updateDoc, setDoc, query, where } from "firebase/firestore";
import { v4 } from 'uuid';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, db, USER_COLLECTION, avatarImg } from '../../features/firebase/firebase';

import './Account.css'

import { useTranslation } from 'react-i18next';
import i18next from "i18next";
import { DocumentScanner, RemoveRoadTwoTone } from '@mui/icons-material';






const language = [
  { value: '1', label: 'Tiếng Việt' },
  { value: '2', label: 'Tiếng Anh' },
];


const AccountInfor = () => {

  const { t, i18n } = useTranslation()

    

  const loginState = useSelector(selectUsers);
  const uid = useSelector((state) => state.login.user);
  const language = useSelector((state) => state.language.choose);
  const dispatch = useDispatch();

  const user = auth.currentUser;

  const [userData, setUserData] = useState(null);
  const [name, setName] = useState('a');
  const [birthday, setBirthday] = useState(dayjs('2023-05-14'));
  const [gender, setGender] = useState('');
  const [money, setMoney] = useState(1);
  const [avatar, setAvatar] = useState('/src/assets/female.png');
  const [img, setImg] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  const formattedMoney = money.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
  const integerMoney = parseInt(formattedMoney.replace(/,/g, ''), 10);


  

  let imageUrl = null;

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  const handleUpload = async () => {
    if (selectedFile) {
      const storageRef = ref(getStorage(), `images/${selectedFile.name}`);
      await uploadBytes(storageRef, selectedFile);
      imageUrl = await getDownloadURL(storageRef);
    }
    else {
      imageUrl = avatarImg;
    }
    await updateDoc(doc(db, USER_COLLECTION, user.uid), {
      avatar: imageUrl,
    }).then(
      setAvatar(imageUrl),
      window.alert(t('accountInfo.capnhatanhdaidienthanhcong'))
    )
  };


  function handleNameChange(event) {
    setName(event.target.value);
  }

  function handleGenderChange(event) {
    setGender(event.target.value);
  }

  function handleMoneyChange(event) {
    const onlyNums = event.target.value.replace(/[^0-9]/g, '');
    setMoney(onlyNums);
  }

  const showInfor = async () => {
    const docRef = doc(db, USER_COLLECTION, uid);
    getDoc(docRef).then(async (docSnap) => {
      if (docSnap.exists()) {
        setUserData(docSnap.data());
        setName(docSnap.data().name);
        const aBirthday = dayjs(docSnap.data().birthday);
        setBirthday(aBirthday);
        const aMoney = docSnap.data().money.toString();
        setMoney(aMoney);
        setGender(docSnap.data().gender);
        // console.log("Document data:", docSnap.data());
        setAvatar(docSnap.data().avatar);
      } else if (user !== null && docSnap.exists() === false) {
        try {
          setDoc(doc(db, USER_COLLECTION, uid), {
            avatar: avatarImg,
            birthday: '2023-05-14',
            gender: true,
            money: 0,
            name: user.displayName,
          });
        } catch (e) {
          // console.error("Error adding document: ", e);
          window.alert("Error adding document:" + e);
        }
      }
      else {
        console.log("No such document!");
        window.alert(t('accountInfo.khongtimthaythongtincuaban'));
      }
    });


  }

  const updateInformation = async () => {
    const usr = user.uid;
    const docRef = doc(db, USER_COLLECTION, usr);

    const dob = birthday.format('DD/MM/YYYY');

    await updateDoc(docRef, {
      name: name,
      birthday: dob,
      gender: gender,
      money: money
    });

    window.alert(t('accountInfo.capnhatthongtinthanhcong'));
  }

  // function handleLanguageChange(event) {
  //   dispatch(lang(event.target.value));
  // }

  const handleLanguageChange = (e) => {
		i18n.changeLanguage(e.target.value);
	};


  useEffect(() => {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        showInfor();
      } else {
        dispatch(signout());
      }
    });
  }, [loginState]);

  function handleUpdate() {
    updateInformation();
  }

  const [typeOne, setTypeOne] = useState("")
  const [typeTwo, setTypeTwo] = useState("")

  const [iD, setiD] = useState([])

  const updateCurrency = async() => {

      const docRef = collection(db, "spending");
      const q = query(docRef, where("uuid", "==", user.uid));
      const querySnapshot = await getDocs(q);
      let iD = []

      querySnapshot.forEach((doc) => {
          // console.log({...doc.data(), id: doc.id});
          doc.data().money = Number(doc.data().money)
          iD.push({
            ID: doc.id,
            MONEY: doc.data().money
          })
        }
      );  
      setiD(iD)
      for(let i = 0; i < iD.length; i++){
          fetch(`${API}`)
              .then(currency => {
                  return currency.json();
                }).then(displayResults);

        function displayResults(currency) {
          handleCurrency(currency)
        }

        const handleCurrency = async(currency) => { 
          let fromRate = currency.rates[typeOne.label];
          let toRate = currency.rates[typeTwo.label];
          iD[i].MONEY = ((toRate / fromRate) * iD[i].MONEY);
          // console.log(iD[i].MONEY)
          await updateDoc(doc(db, 'spending', iD[i].ID, ), {money: iD[i].MONEY})
        }
      } 
      window.alert(t('accountInfo.capnhattygiathanhcong'));

     
  }
  
  
  return (
    <div className='account mt-4'>
      <Box className='row justify-content-center'>
        <h3 className='my-2'>{t('accountInfo.tieude')}</h3>
        <Box className='col-md-3'>
          {/* Avatar */}
          <Box className='d-flex align-items-center flex-column mt-3'>
            <img
              className="img_avatar img-fluid rounded-circle shadow-4-strong"
              alt={name}
              src={avatar}
            />
            <Box className='text-center' sx={{ width: 300, overflow: 'hidden' }}>
              <input
                accept="image/*"
                id="imageUpload"
                multiple
                type="file"
                onChange={handleFileChange}
                alt='avatar'
                className='py-2 border border-dark'
                data-i18n="[value]showcase.search-value"
              />
              <Button
                type="file"
                className='my-2'
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleUpload}
              >
                {t('accountInfo.anh')}
              </Button>
            </Box>

          </Box>
        </Box>
        <Box className='col-md-6'>
          {/* User information */}
          <Box className='my-3 t-box'>
            <TextField
              InputLabelProps={{ shrink: true }}
              required
              hiddenLabel
              id="name-input"
              label={t('accountInfo.ten')}
              variant="outlined"
              fullWidth
              value={name}
              onChange={handleNameChange}
              helperText={name ? "" : t('accountInfo.thieuten')}
              error={name ? false : true}
            />
          </Box>
          <Box className='my-3'>
            {/* <p className='form-control'>{userData?.birthday}</p> */}
            <DatePicker
              label={t('accountInfo.ngaysinh')}
              value={birthday}
              onChange={(newValue) => setBirthday(newValue)}
              slotProps={{ textField: { variant: 'outlined' } }}
            />
          </Box>
          <Box className='my-3 w-box'>
            {/* <p className='form-control'>{userData?.gender}</p> */}
            <FormControl fullWidth>
              <InputLabel id="demo-simple-select-label">{t('accountInfo.gioitinh')}</InputLabel>
              <Select
                labelId="demo-simple-select-label"
                id="gender-select"
                value={gender}
                label="ngày sinh"
                onChange={handleGenderChange}
              >
                <MenuItem value={true}>{t('accountInfo.gioitinhnam')}</MenuItem>
                <MenuItem value={false}>{t('accountInfo.gioitinhnu')}</MenuItem>
              </Select>
            </FormControl>
          </Box>
          <Box className='my-3 t-box'>
            <TextField
              input="text"
              InputLabelProps={{ shrink: true, inputMode: 'numeric', pattern: '[0-9]*' }}
              required
              hiddenLabel
              id="standard-basic"
              label={t('accountInfo.tienhangthang')}
              variant="outlined"
              fullWidth
              value={money}
              onChange={handleMoneyChange}
              helperText={money ? "" : t('accountInfo.thieusotienhangthang')}
              error={money ? false : true}
            />
          </Box>
        </Box>
      </Box>
      {/* Button */}
      <Box className='d-flex justify-content-center mb-4'>
        <button className='button-logout' onClick={handleUpdate}>{t('accountInfo.luu')}</button>
      </Box>
      <hr />
      <h3 className='my-2'>{t('accountInfo.xuatcsv')}:</h3>
      <Box className="mx-3 text-center">
        <Button variant="contained">{t('accountInfo.xuatcsv')}</Button>
      </Box>
      <hr />
      <h3 className='my-2'>{t('accountInfo.ngonngu')}:</h3>
      <Box className="mx-3 text-center">
        <FormControl>
          <InputLabel id="language-label" sx={{ fontFamily: "Montserrat", fontWeight: "bold" }}>{t('accountInfo.ngonngu')}</InputLabel>
          <Select
            labelId="language-label"
            id="language-select"
            value={localStorage.getItem("i18nextLng")}
            label="Ngôn ngữ."
            onChange={handleLanguageChange}
          >
            <MenuItem value="vi" className='languageV'>{t('accountInfo.ngonnguviet')}</MenuItem>
            <MenuItem value="en" className='languageE'>{t('accountInfo.ngonnguanh')}</MenuItem>
          </Select>

         
        </FormControl>
      </Box>

      
      <hr />
    </div>
  );
};

export default AccountInfor;
