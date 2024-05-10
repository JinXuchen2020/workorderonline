import { Col, Row } from 'antd';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuthUrl, getQRCode } from '../utils/api';
import { isWxBrowser } from '../utils';
import { useWeChatLogin } from '../hooks';

export const Login : React.FC = () => {
  const navigate = useNavigate();
  const [qrCodeUrl, setQrCodeUrl] = useState('');

  const {isLoggedIn} = useWeChatLogin();

  useEffect(() => {
    if (isLoggedIn) {
      navigate('/');
    }
    else {
      if (isWxBrowser()) {
        getAuthUrl().then(rsp => {
          rsp.json().then(data => {
            const authUrl = data.data as string;
            window.location.href = authUrl;
          })
        })
      }
      else{
        getQRCode().then(rsp => {
          rsp.json().then(data => {
            setQrCodeUrl(data.data as string);
          })
        })
      }
    }
  },[isLoggedIn])

  return (
    <div className='preview-result' style={{textAlign: 'left'}}>
      <Row>
        <Col style={{textAlign: 'center'}} span={24}>
          <div id='codeArea'>
            <iframe title='login' frameBorder='0' sandbox='allow-scripts allow-same-origin allow-top-navigation' scrolling='no'  
            src={qrCodeUrl} height='400'></iframe>
          </div>
        </Col>
      </Row>
    </div>
  )
}
