import { Outlet, NavLink } from 'react-router-dom'
import { useState } from 'react'

import Cookies from "js-cookie";
import { useAuth } from "../regusers/AuthProvider"
import logo from './icons/glaz.jpg';



export default function Start() {
	const setActive = ({isActive}) => isActive ? 'active-link' : '';
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);    

  const removeCookie = () => {
          Cookies.remove("RT");
          Cookies.remove("Authorization");
          logout()
          console.log("All Cookie has been removed!");
      }
    

	return (
		<>
		  <header>      

            <h2><NavLink to="/" className={setActive}>Home</NavLink></h2>

            <p>Разделы ></p>
            <h2><NavLink to="/knowledges/" className={setActive}>База знаний</NavLink></h2>
            <h2><NavLink to="/projects/" className={setActive}>Управление проектами</NavLink></h2>
            <h2><NavLink to="/roadmaps/" className={setActive}>Путь развития</NavLink></h2>


            <p>Информация о пользователе ></p>
            
            { !user && 
            <>
            <h3>Не авторизован</h3>
            <h2><NavLink to="/regusers/authorization/" className={setActive}>Войти</NavLink></h2> 
            </>
            }

            { user && 
            <>
            <h1>{user.fullName}</h1>
            
            <button onClick={removeCookie} className="cancel-button">ВЫХОД</button>
            </>
            }


      </header>
     
      <main> 

          <Outlet />

      </main>
      
      
      <footer className="footer">
        

        {/* НИЖНЯЯ ПОЛОСА */}
        <div className="footer-bottom">
          <img className="logo-style" src={logo} /> © 2025 База знаний. 
        </div>
    </footer>

      </>
		)


}







export { Start }

