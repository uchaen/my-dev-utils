import React, { useState, useEffect } from 'react';
import CryptoJS from 'crypto-js';

// Jasypt PBEWithMD5AndDES 구현
// Algorithm: PBEWithMD5AndDES
// Key Derivation: MD5 해시, 1000 iterations (PBKDF1)
// Salt: 암호문 앞의 8바이트

const ITERATIONS = 1000;
const SALT_SIZE = 8;
const KEY_SIZE = 8;
const IV_SIZE = 8;

// PBKDF1 구현 (MD5, 1000 iterations)
// T_1 = MD5(Password || Salt), T_i = MD5(T_{i-1}) for i=2..iterations
function pbkdf1(password, salt, iterations) {
  const passwordBytes = CryptoJS.enc.Utf8.parse(password);
  const combined = CryptoJS.lib.WordArray.create().concat(passwordBytes).concat(salt);
  
  let T = CryptoJS.MD5(combined);
  for (let i = 2; i <= iterations; i++) {
    T = CryptoJS.MD5(T);
  }
  
  return T;
}

// Key/IV 생성 헬퍼 함수
function deriveKeyAndIV(keyMaterial) {
  const key = CryptoJS.lib.WordArray.create(keyMaterial.words.slice(0, 2));
  key.sigBytes = KEY_SIZE;
  
  const iv = CryptoJS.lib.WordArray.create(keyMaterial.words.slice(2, 4));
  iv.sigBytes = IV_SIZE;
  
  return { key, iv };
}

function jasyptEncrypt(text, password) {
  if (!text || !password) return '';

  try {
    const salt = CryptoJS.lib.WordArray.random(SALT_SIZE);
    const keyMaterial = pbkdf1(password, salt, ITERATIONS);
    const { key, iv } = deriveKeyAndIV(keyMaterial);

    const encrypted = CryptoJS.DES.encrypt(text, key, {
      iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });

    const saltAndCiphertext = CryptoJS.lib.WordArray.create()
      .concat(salt)
      .concat(encrypted.ciphertext);

    return saltAndCiphertext.toString(CryptoJS.enc.Base64);
  } catch (error) {
    return '암호화 오류: 입력값을 확인하세요.';
  }
}

function jasyptDecrypt(encryptedText, password) {
  if (!encryptedText || !password) return '';

  try {
    const decoded = CryptoJS.enc.Base64.parse(encryptedText);

    if (decoded.sigBytes < SALT_SIZE) {
      return '복호화 오류: 암호문이 너무 짧습니다.';
    }

    const salt = CryptoJS.lib.WordArray.create();
    salt.words = decoded.words.slice(0, 2);
    salt.sigBytes = SALT_SIZE;

    const ciphertext = CryptoJS.lib.WordArray.create();
    ciphertext.words = decoded.words.slice(2);
    ciphertext.sigBytes = decoded.sigBytes - SALT_SIZE;

    if (ciphertext.sigBytes <= 0) {
      return '복호화 오류: 암호문에 데이터가 없습니다.';
    }

    const keyMaterial = pbkdf1(password, salt, ITERATIONS);
    const { key, iv } = deriveKeyAndIV(keyMaterial);

    const cipherParams = CryptoJS.lib.CipherParams.create({ ciphertext });
    const decrypted = CryptoJS.DES.decrypt(cipherParams, key, {
      iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });

    const result = decrypted.toString(CryptoJS.enc.Utf8);

    if (!result) {
      return '복호화 오류: 결과가 비어있습니다. 비밀번호 또는 암호문을 확인하세요.';
    }

    return result;
  } catch (error) {
    return '복호화 오류: 입력값을 확인하세요.';
  }
}


function JasyptEncryptor() {
  const [encPlain, setEncPlain] = useState(() => {
    const saved = sessionStorage.getItem('jasypt-encPlain');
    return saved || '';
  });
  const [encPassword, setEncPassword] = useState(() => {
    const saved = sessionStorage.getItem('jasypt-encPassword');
    return saved || '';
  });
  const [encOutput, setEncOutput] = useState('');
  const [encCopied, setEncCopied] = useState(false);

  const [decCipher, setDecCipher] = useState(() => {
    const saved = sessionStorage.getItem('jasypt-decCipher');
    return saved || '';
  });
  const [decPassword, setDecPassword] = useState(() => {
    const saved = sessionStorage.getItem('jasypt-decPassword');
    return saved || '';
  });
  const [decOutput, setDecOutput] = useState('');
  const [decCopied, setDecCopied] = useState(false);

  useEffect(() => {
    if (encPlain && encPassword) {
      setEncOutput(jasyptEncrypt(encPlain, encPassword));
    } else {
      setEncOutput('');
    }
  }, [encPlain, encPassword]);

  useEffect(() => {
    if (decCipher && decPassword) {
      setDecOutput(jasyptDecrypt(decCipher, decPassword));
    } else {
      setDecOutput('');
    }
  }, [decCipher, decPassword]);

  // sessionStorage에 저장
  useEffect(() => {
    if (encPlain) {
      sessionStorage.setItem('jasypt-encPlain', encPlain);
    } else {
      sessionStorage.removeItem('jasypt-encPlain');
    }
  }, [encPlain]);

  useEffect(() => {
    if (encPassword) {
      sessionStorage.setItem('jasypt-encPassword', encPassword);
    } else {
      sessionStorage.removeItem('jasypt-encPassword');
    }
  }, [encPassword]);

  useEffect(() => {
    if (decCipher) {
      sessionStorage.setItem('jasypt-decCipher', decCipher);
    } else {
      sessionStorage.removeItem('jasypt-decCipher');
    }
  }, [decCipher]);

  useEffect(() => {
    if (decPassword) {
      sessionStorage.setItem('jasypt-decPassword', decPassword);
    } else {
      sessionStorage.removeItem('jasypt-decPassword');
    }
  }, [decPassword]);

  const clearEncrypt = () => {
    setEncPlain('');
    setEncPassword('');
    setEncOutput('');
    sessionStorage.removeItem('jasypt-encPlain');
    sessionStorage.removeItem('jasypt-encPassword');
  };

  const clearDecrypt = () => {
    setDecCipher('');
    setDecPassword('');
    setDecOutput('');
    sessionStorage.removeItem('jasypt-decCipher');
    sessionStorage.removeItem('jasypt-decPassword');
  };

  const copyToClipboard = (text, setCopied) => {
    if (text) {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  return (
    <div className="tool-container tool-container-full">
      <div className="tool-header">
        <h2>Jasypt 암호화/복호화</h2>
        <p>Java Jasypt의 PBEWithMD5AndDES 방식으로 텍스트를 실시간 암호화/복호화합니다.</p>
      </div>

      <div className="tool-grid">
        <div className="tool-card tool-card-no-margin tool-card-flex">
          <div className="card-header">
            <h3>암호화 입력</h3>
            <button className="btn btn-secondary btn-small" onClick={clearEncrypt}>
              초기화
            </button>
          </div>
          <div className="flex-1 flex-column">
            <label className="input-label">Password</label>
            <input
              type="text"
              className="input-field input-field-with-margin"
              placeholder="암호화 키를 입력하세요"
              value={encPassword}
              onChange={(e) => setEncPassword(e.target.value)}
            />
            <label className="input-label">평문</label>
            <textarea
              className="input-field flex-textarea"
              placeholder="암호화할 텍스트를 입력하세요..."
              value={encPlain}
              onChange={(e) => setEncPlain(e.target.value)}
            />
          </div>
        </div>

        <div className="tool-card tool-card-no-margin tool-card-flex">
          <div className="card-header">
            <h3>암호화 결과</h3>
            {encOutput && (
              <button
                className="btn btn-secondary btn-small"
                onClick={() => copyToClipboard(encOutput, setEncCopied)}
              >
                {encCopied ? '✓' : '복사'}
              </button>
            )}
          </div>
          <div className="flex-1">
            <div className={`output-area flex-output ${encOutput ? 'success' : ''}`}>
              {encOutput || (
                <span className="output-placeholder">
                  Password와 평문을 입력하면 암호문이 표시됩니다.
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="tool-card tool-card-no-margin tool-card-flex">
          <div className="card-header">
            <h3>복호화 입력</h3>
            <button className="btn btn-secondary btn-small" onClick={clearDecrypt}>
              초기화
            </button>
          </div>
          <div className="flex-1 flex-column">
            <label className="input-label">Password</label>
            <input
              type="text"
              className="input-field input-field-with-margin"
              placeholder="암호화 키를 입력하세요"
              value={decPassword}
              onChange={(e) => setDecPassword(e.target.value)}
            />
            <label className="input-label">암호문</label>
            <textarea
              className="input-field flex-textarea"
              placeholder="복호화할 암호문을 입력하세요..."
              value={decCipher}
              onChange={(e) => setDecCipher(e.target.value)}
            />
          </div>
        </div>

        <div className="tool-card tool-card-no-margin tool-card-flex">
          <div className="card-header">
            <h3>복호화 결과</h3>
            {decOutput && (
              <button
                className="btn btn-secondary btn-small"
                onClick={() => copyToClipboard(decOutput, setDecCopied)}
              >
                {decCopied ? '✓' : '복사'}
              </button>
            )}
          </div>
          <div className="flex-1">
            <div
              className={`output-area flex-output ${
                decOutput
                  ? decOutput.startsWith('복호화 오류')
                    ? 'error'
                    : 'success'
                  : ''
              }`}
            >
              {decOutput || (
                <span className="output-placeholder">
                  Password와 암호문을 입력하면 평문이 표시됩니다.
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default JasyptEncryptor;