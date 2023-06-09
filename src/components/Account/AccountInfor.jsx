import React, { useState, useEffect } from 'react';

import AddIcon from '@mui/icons-material/Add';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import { CircularProgress, Select,FormControl, MenuItem, InputLabel, Box, TextField, Button, Alert } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import dayjs from 'dayjs';

import save from '../../assets/Save.png'
import SpendingData from '../SpendingData/SpendingData'

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
import { auth, db, USER_COLLECTION, avatarImg, SPEND_COLLECTION } from '../../features/firebase/firebase';

import './Account.css'

import { useTranslation } from 'react-i18next';
import i18next from "i18next";

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
  const [error, setError] = useState('');

  const user = auth.currentUser;

  const [userData, setUserData] = useState(null);
  const [name, setName] = useState('a');
  const [birthday, setBirthday] = useState(dayjs('2023-05-14'));
  const [gender, setGender] = useState('');
  const [money, setMoney] = useState(1);
  const [avatar, setAvatar] = useState('/src/assets/female.png');
  const [img, setImg] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [loadingImg, setLoadingImg] = useState(true);

  const formattedMoney = money.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
  const integerMoney = parseInt(formattedMoney.replace(/,/g, ''), 10);

  let moneyInt = 0;

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
      setError(t('accountInfo.vuilongchonanh'));
      return;
    }
    await updateDoc(doc(db, USER_COLLECTION, user.uid), {
      avatar: imageUrl,
    }).then(
      setAvatar(imageUrl),
    )
    if (imageUrl)
      {
        setError('')
        window.alert(t('accountInfo.capnhatanhdaidienthanhcong'))
      }
    
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
    let avatarUrl = null;
    if (user.photoURL)
      avatarUrl = user.photoURL;
    else avatarUrl = avatarImg;
    getDoc(docRef).then(async (docSnap) => {
      if (docSnap.exists()) {
        setUserData(docSnap.data());
        setName(docSnap.data().name);
        const userAgent = navigator.userAgent;
        const aBirthday = dayjs(docSnap.data().birthday, 'DD/MM/YYYY');
        setBirthday(aBirthday);
        const aMoney = docSnap.data().money.toString();
        setMoney(aMoney);
        setGender(docSnap.data().gender);
        // console.log("Document data:", docSnap.data());
        setAvatar(docSnap.data().avatar);
      } else if (user !== null && docSnap.exists() === false) {
        try {
          setDoc(doc(db, USER_COLLECTION, uid), {
            avatar: avatarUrl,
            birthday: '01/06/2023',
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
        // console.log("No such document!");
        window.alert(t('accountInfo.khongtimthaythongtincuaban'));
      }
    });
    setLoadingImg(false);

  }

  const updateInformation = async () => {
    const usr = user.uid;
    const docRef = doc(db, USER_COLLECTION, usr);

    const dob = birthday.format('DD/MM/YYYY');

    if (typeof money === 'string') {
      moneyInt = parseInt(money.replace(/[^0-9.-]+/g,""));
    }
    else if (typeof money === 'number') {
      moneyInt = money;
    }

    await updateDoc(docRef, {
      name: name,
      birthday: dob,
      gender: gender,
      money: moneyInt
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

    const [spendingData, setSpendingData] = useState([]);
    const [deleteSpending, setDeleteSpending] = useState(false);
    const _user = useSelector((state) => state.login.user);
    const _addSpending = useSelector((state) => state.spend.isOpen);

    //   const useruid = user.uid;
    const getAllSpending = async () => {
        const docRef = collection(db, SPEND_COLLECTION);
        const q = query(docRef, where("uuid", "==", _user));
        const querySnapshot = await getDocs(q);
        const data = [];
        querySnapshot.forEach((doc) => {
            // console.log(doc.id, " => ", doc.data());
            data.push({ id: doc.id, ...doc.data() });
        });
        data.sort((a, b) => b.date.toDate() - a.date.toDate()); // Sort by date
        const groupedData = data.reduce((acc, spending) => {
          const date = spending.date.toDate().toLocaleDateString();
          if (!acc[date]) {
            acc[date] = [];
          }
          acc[date].push(spending);
          return acc;
        }, {});
        setSpendingData(groupedData);
    }

    useEffect(() => {
        getAllSpending();
    }, [_addSpending, deleteSpending]);
  
  
  return (
    <div className='account'>
      <div className='account-info d-flex flex-row'>
      {/* image */}
        <div className='boxImage1 col-md-2'>
          <Box className='boxImage2 d-flex align-items-center flex-column mt-1'>
            { loadingImg ? <CircularProgress /> :
            <label htmlFor="imageUpload" className="position-relative mb-2">
              <img
                className="img_avatar img-fluid rounded-circle shadow-4-strong"
                alt={name}
                src={avatar}
                style={{ transition: 'transform 0.2s ease-in-out' }}
                onMouseEnter={() => {
                  document.querySelector('.img_avatar').style.transform = 'scale(1.1)';
                }}
                onMouseLeave={() => {
                  document.querySelector('.img_avatar').style.transform = 'scale(1)';
                }}
              />
              <input
                accept="image/*"
                id="imageUpload"
                multiple
                type="file"
                onChange={(e) => {
                  handleFileChange(e);
                  const file = e.target.files[0];
                  const imageUrl = URL.createObjectURL(file);
                  document.querySelector('.img_avatar').src = imageUrl;
                }}
                style={{ display: 'none' }}
              />
              <span
                className="position-absolute bottom-0 start-50 translate-middle"
                style={{ fontSize: '1.5rem' }}
              >
                <i className="bi bi-camera-fill">
                  <CameraAltIcon />
                </i>
              </span>
            </label>
            }
            {
              error && <Alert severity="error">{error}</Alert>
            }
            <Box className='text-center' sx={{ width: 300, overflow: 'hidden'}}>
              <button
                type="file"
                className='saveImage'
                variant="contained"
                starticon={<AddIcon />}
                onClick={handleUpload}
              >
                <p className='title-save-img fs-6 fw-normal'>{t('accountInfo.anh')}</p>
              </button>
            </Box>

          </Box>
        </div>

        {/* user information */}
        <div className='information d-flex flex-column'>
          <div className='infor d-flex flex-row justify-content-between'>
            <TextField
              className='input-na'
              InputLabelProps={{ shrink: true }}
              required
              hiddenLabel
              // id="name-input"
              label={t('accountInfo.ten')}
              variant="outlined"
              value={name}
              onChange={handleNameChange}
              helperText={name ? "" : t('accountInfo.thieuten')}
              error={name ? false : true}
            />
            <DatePicker
              label={t('accountInfo.ngaysinh')}
              value={birthday}
              className='input-na'
              onChange={(newValue) => setBirthday(newValue)}
              slotProps={{ textField: { variant: 'outlined' } }}
              format='DD/MM/YYYY'
            />
             <FormControl className='input-na'>
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
          </div>
            <div className='d-flex flex-row justify-content-between'>

              <TextField
                input="text"
                InputLabelProps={{ shrink: true, inputMode: 'numeric', pattern: '[0-9]*' }}
                required
                hiddenLabel
                id="standard-basic"
                label={t('accountInfo.tienhangthang')}
                variant="outlined"
                className='input-na'
                value={money}
                onChange={handleMoneyChange}
                helperText={money ? "" : t('accountInfo.thieusotienhangthang')}
                error={money ? false : true}
              />
              <FormControl className='input-na'>
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
                  <button className='btn-save d-flex flex-row' onClick={handleUpdate}><img className='image-save' src={save}/>
                  <p className='title-save fs-6 fw-bold'>{t('accountInfo.luu')}</p>
                  </button>
                
            </div>
          </div>
        </div>


    
      
      {/* <hr /> */}
        <div className='history'>
            <div className='row justify-content-center'>
                <p className='title fs-2 fw-bold'>{t('editSpending.lichsu')}</p>
                <div className='mt-2'>
                    {Object.entries(spendingData).map(([date, spendings]) => (
                      <div key={date}>
                        <h4 className='pl-1 text-danger mt-1' style={{ paddingLeft: '1rem' }}>{t('editSpending.ngay')}: {date}</h4>
                        {Array.isArray(spendings) && spendings.map((spending) => (
                          <SpendingData key={spending.id} spending={spending} setDeleteSpending={setDeleteSpending}/>
                        ))}
                      </div>
                    ))}
                </div>
            </div>
        </div>
    </div>

  );
};

export default AccountInfor;
