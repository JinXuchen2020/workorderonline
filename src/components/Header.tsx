import React from 'react';
import { Avatar, Space, Row, Col } from 'antd';
import { useNavigate } from 'react-router-dom';
import { UserOutlined } from "@ant-design/icons";
import { useWeChatLogin } from '../hooks';

export const HeaderCtl: React.FunctionComponent<{userInfo: any, callback: any}> = ({userInfo, callback}) => {
  let navigate = useNavigate()
  const {handleLogout} = useWeChatLogin();

  const handleLoginOut = () => {
    callback();
    handleLogout();
    navigate("/Login")
  }

  return (
    <>
      <Row>
        <Col xs={0} sm={24}>
          <Space style={{float: 'right', cursor:'pointer'}}>
            {
              userInfo === undefined ? undefined
                : (
                <>
                  <Avatar onClick={handleLoginOut} size="large" icon={<UserOutlined />} />
                  <label>{userInfo.nickname}</label>
                </>)
            }
          </Space>
        </Col>
        <Col xs={24} sm={0}>
          <Space style={{float: 'right', cursor:'pointer'}}>
            {
              userInfo === undefined ? undefined
                : (
                <>
                  <Avatar onClick={handleLoginOut} size="large" icon={<UserOutlined />} />
                </>)
            }
          </Space>
        </Col>
      </Row>
    </>
  )
}
