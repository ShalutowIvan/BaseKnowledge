import { useLocation } from 'react-router-dom'


const Registration_after = () => {  
  const location = useLocation();
  const email = location.state?.message;

  return (
    <div className="list-knowledge">
      <h1 style={{ textAlign: 'center' }}>Для завершения регистрации перейдите по ссылке из письма!</h1>
      <h1 style={{ textAlign: 'center' }}>Письмо отправлено на почту {email}.</h1>     
      
    </div>
  );
};

export { Registration_after };