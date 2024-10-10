import { Col, Row } from 'antd';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuthUrl, getQRCode } from '../utils/api';
import { isWxBrowser } from '../utils';
import { useWeChatLogin } from '../hooks';

export const Login : React.FC = () => {
  const navigate = useNavigate();
  // const [form] = Form.useForm<{ 'id': any }>();

  // const id = Form.useWatch('id', form);

  const [qrCodeUrl, setQrCodeUrl] = useState('');

  const {isLoggedIn } = useWeChatLogin();

  // const handleLogin = async () => {
  //   await form.validateFields();
  //   if(id) 
  //   {
  //     const option ={
  //       nickname: id,
  //       openid: id
  //     }
  //     await handleTempLogin(option);
  //     navigate('/');
  //   }
  // }

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
            // sessionStorage.setItem('authUrl', authUrl);
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
        <Col span={24} style={{ display: 'flex', justifyContent: 'center' }}>
          {/* <Form
            form={form}
            name='login'
            labelCol={{span: 9}}
            wrapperCol={{span: 7}}
            layout={'horizontal'}
            onFinish={handleLogin}
          >
            <Form.Item label='账号' name='id' rules={[{ required: true, message: '请输入手机号' }, { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号' }]}>
              <Input placeholder='请输入手机号'/>
            </Form.Item>
            <Form.Item wrapperCol={{span: 24}} style={{textAlign:'center'}}>
              <Space>
                <Button type='primary' htmlType='submit'>登陆</Button>
              </Space>
            </Form.Item>
          </Form> */}
          <div id='codeArea'>
            <iframe title='login' frameBorder='0' sandbox='allow-scripts allow-same-origin allow-top-navigation' scrolling='no'  
            src={qrCodeUrl} height='400'></iframe>
          </div>
        </Col>
      </Row>
    </div>
  )
}
