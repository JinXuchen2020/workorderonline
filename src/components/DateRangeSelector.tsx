import { DatePicker, Form, Modal } from "antd";
import { FunctionComponent } from "react";
import { useSearchParams } from "react-router-dom";

export const DateRangeSelector : FunctionComponent<{visible: boolean, callback: Function}> = ({visible, callback}) => {
  const [form] = Form.useForm<{ 'dateRange': any }>();

  const dateRangeValue = Form.useWatch('dateRange', form);

  const [_, setSearchParams] = useSearchParams(); 

  const handleClick = async ()=> 
  {
    await form.validateFields();
    if (dateRangeValue){
      const [start, end] = dateRangeValue;
      const result = {
        start: start.format('YYYY-MM-DD'),
        end: end.format('YYYY-MM-DD')
      }      

      setSearchParams(result)
      callback(false);
    }
  }

  return (
    <Modal
      title="请选择时间"
      open={visible}
      width={600}
      maskClosable={false}
      centered={true}
      onOk={handleClick}
      onCancel={() => callback(false)}
    >
      <Form form={form} layout="horizontal">
        <Form.Item name={"dateRange"} label="时间范围">
          <DatePicker.RangePicker />
        </Form.Item>
      </Form>
    </Modal>
  );
}