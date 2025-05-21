import { Link, Outlet, NavLink, useLoaderData, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'

import Cookies from "js-cookie";
import axios from "axios";


// import { getRefreshToken, getAccessToken } from "../regusers/AuthService"
// import { jwtDecode } from 'jwt-decode'

// import { useAuth } from "../regusers/AuthProvider"

// import { API } from "../apiAxios/apiAxios"



export default function Start() {
	const setActive = ({isActive}) => isActive ? 'active-link' : '';
  const [state, setState ] = useState(null)
    // const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
    
    useEffect(() => {
        axios.get('http://127.0.0.1:8000')
        .then(response => {
        setState(response.data.fio);
        setLoading(false);
      })
      .catch(error => {
        setError(error);
        setLoading(false);
      });
            
         
    }, [])

    
    

	return (
		<>
		  <header>      

            <h2><NavLink to="/" className={setActive}>Start</NavLink></h2>

            <p>Разделы ></p>
            <h2><NavLink to="/BaseKnowledge/" className={setActive}>База знаний</NavLink></h2>
            <h2><NavLink to="/ProjectManagement/" className={setActive}>Управление проектами</NavLink></h2>
            <h2><NavLink to="/RoadMap/" className={setActive}>Путь развития</NavLink></h2>


            <p>Информация о пользователе ></p>
            <h1>{state}</h1>
            


      </header>


      <aside>

          
          

            
      </aside>

      <main>
            
            
          <h1>Добро пожаловать!</h1>  
           
            

            <Outlet />
        

      </main>
      
      <footer className="footer">
        <h1>ТУТ ПОДВАЛ</h1>
      	2025 год

      </footer>

      </>
		)


}







export { Start }

