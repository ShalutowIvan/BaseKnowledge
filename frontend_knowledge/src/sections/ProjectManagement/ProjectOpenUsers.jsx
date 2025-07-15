import { useState } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import { API } from "../../apiAxios/apiAxios"



function ProjectOpenUsers() {
	const [usersearch, setUsersearch] = useState("");
	const [email, setEmail] = useState("");
    const [emailCurrentUser, setEmailCurrentUser] = useState("");//для поиска текущего пользака проекта
    const [currentUsers, setCurrentUsers] = useState([]);//текущие пользователи проекта

	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);

    // состояние для отображения кнопки пригласить/исключить пользователя из проекта
    const [visibleInvite, setVisibleInvite] = useState(true)


	const { project_id } = useParams()

	const validateForm = () => {
        if (!email) {
            setError("Для поиска пользователя введите Email!");
            return false;
        }
        setError('');
        return true;
    }

  const navigate = useNavigate();
  
  const SearchToInvite = async (event) => {
        event.preventDefault();
        if (!validateForm()) return;
        setLoading(true);

        try {
            const response = await axios.get('http://127.0.0.1:8000/search_user', {
                params: {                 
                    email_user: email,
                    project_id: project_id
                }
                }
                );
            setLoading(false);

            // if (!response.data?.id) {
            //     throw new Error("Некорректный формат ответа сервера");
            //   }
            
            // тут обработать ошибку валидации когда список пользаков пустой!!!!!!!!!!!!! Типа если статус ответа 400 то пустой список записываем в состояние списка пользаков, или ничего не меняем. 
            console.log(response.status, "статус")
            if (response.statusText==='OK') {
				setEmail("");
				setUsersearch(response.data.user)
                setVisibleInvite(response.data.invite)
      
            } 
        } catch (error) {
        
              if (axios.isAxiosError(error) && error.response?.status === 400) {                
                setUsersearch("")
                setError(`Пользователь не найден!`);            
              }               

            setLoading(false);
            console.log("Ошибка на сервере:", error)

            // setError(`что-то пошло не так, ошибка: ${error}`);            
        }    
    };

	const inviteToProject = async () => {
		setLoading(true);
		try {			
            const response = await axios.post('http://127.0.0.1:8000/invite_to_project/', {                                 
                user_id: usersearch.id,
				project_id: project_id        
                }
                );
            setLoading(false);
            
            if (response.statusText==='OK') {
				console.log("Пользователь добавлен в проект!")
                setVisibleInvite(false)
                      
            } else {
                const errorData = await response.data
                console.log(errorData, 'тут ошибка')     
            }
        } catch (error) {
            setLoading(false);
            console.log(error)
            setError('что-то пошло не так');            
        }    
	}


	const excludeFromProject = async () => {
		setLoading(true);
		try {
			
            const response = await API.delete('http://127.0.0.1:8000/exclude_from_project/', {                                 
                data: {
					user_id: usersearch.id,
					project_id: project_id
				}			
				
                }
                );
            setLoading(false);
            
            if (response.data.answer) {
                alert("Нельзя удалить себя!")
            }            
            else if (response.statusText==='OK') {
				console.log("Пользователь добавлен в проект!")
				setVisibleInvite(true)
      
            } else {
                const errorData = await response.data
                console.log(errorData, 'тут ошибка')     
            }
        } catch (error) {
            setLoading(false);
            console.log(error)
            setError('что-то пошло не так');            
        }    
	}


	const SearchCurrentUsers = async (event) => {
        event.preventDefault();
        if (!validateForm()) return;
        setLoading(true);

        try {
            const response = await axios.get('http://127.0.0.1:8000/search_current_users', {
                params: {                 
                    email_user: emailCurrentUser,
                    project_id: project_id
                }
                }
                );
            setLoading(false);

            // if (!response.data?.id) {
            //     throw new Error("Некорректный формат ответа сервера");
            //   }
            
            if (response.statusText==='OK') {
				setEmailCurrentUser("");
				setCurrentUsers(response.data)                
      
            } else {
                const errorData = await response.data
                console.log(errorData, 'тут ошибка')     
            }
        } catch (error) {
            setLoading(false);
            console.log(error)
            setError('что-то пошло не так');            
        }    
    };


    const [showCurrentUsers, setShowCurrentUsers] = useState(false);
    const [errorUser, setErrorUser] = useState("");


    const AllUsersProject = async () => {
        setLoading(true);

        try {
            const response = await axios.get('http://127.0.0.1:8000/all_current_users_project', {
                params: {
                    project_id: project_id
                }
                }
                );
            setLoading(false);

            // if (!response.data?.id) {
            //     throw new Error("Некорректный формат ответа сервера");
            //   }
            
            if (response.statusText==='OK') {		
				setCurrentUsers(response.data)                
      
            } else {
                const errorData = await response.data
                console.log(errorData, 'тут ошибка')     
            }
        } catch (error) {
            setLoading(false);
            console.log(error)
            setErrorUser('что-то пошло не так');            
        }  
    }

    const [modifyRole, setModifyRole ] = useState(false)
    // const [selectedRole, setSelectedRole] = useState("");

    const ROLES_USERS = {
      ADMIN: 'admin',
      EDITOR: 'editor',
      VIEWER: 'viewer',
      GUEST: 'guest'
    };

    //это функция для изменения состояния роли в таблице
    const updateRole = (itemId, newRole) => {
        setCurrentUsers(prevItems => 
            prevItems.map(item => 
                item.id === itemId 
                    ? { 
                        ...item, 
                        role: newRole === '' ? null : newRole
                      } 
                    : item
            )
        );
    };

    const saveRole = async (user_id, role) => {
        // e.preventDefault();
        try {
            setLoading(true);
            
            const response = await axios.patch(
                    `http://127.0.0.1:8000/role_project_change/`,
                    {
                    project_id: project_id,
                    user_id: user_id,
                    role: role
                    }                
                    );
                setModifyRole(false)
                setErrorUser("")
                if (response.statusText==='OK') {                    
                    console.log("Update complete!")                
                } else {
                    const errorData = await response.data
                    console.log(errorData, 'тут ошибка')
                }
            } catch (error) {
                console.log("ошибка тут", error)
                setErrorUser(error)
                if (error.response) {
                // Сервер ответил с ошибкой 4xx/5xx
                setErrorUser(error.response.data?.detail || error.message);
                } 
            } finally {
            setLoading(false);
            }    
    }

    


	return (
		<div className="header-chapter">
			<div className='container-user'>
				<div>
				<h1>Текущие пользователи проекта</h1>
				{!showCurrentUsers &&
                <button className='toolbar-button' onClick={() => {setShowCurrentUsers(!showCurrentUsers); AllUsersProject();}}>Показать текущих пользователей</button>
                }
                {showCurrentUsers && 
                <button className='toolbar-button' onClick={() => {setShowCurrentUsers(!showCurrentUsers);}}>Скрыть текущих пользователей</button>
                }
                <br/><br/>

                {showCurrentUsers && 
                <div className='table-editor'>
				<table>
                        <thead>
                            <tr>
                                <th>Имя пользователя</th>
                                <th>Email</th>
								<th>Роль</th>
                                <th>Действие</th>
                            </tr>
                        </thead>

                        <tbody>
                            {currentUsers?.map(item => (
                                <tr>
                                <td>{item.name}</td>
                                <td>{item.email}</td>
								<td>
                                {item.role}
								</td>
                                <td>
                                <div>
                                    {!modifyRole ? (
                                        <>
                                        <button onClick={() => {setModifyRole(true);}} className="change-button"></button>
                                        </>
                                    ) : (
                                    <>                                    
                                    <select value={item.role} onChange={(e) => updateRole(item.id, e.target.value)}>
                                        <option value={ROLES_USERS.ADMIN}>Админ</option>
                                        <option value={ROLES_USERS.EDITOR}>Редактор</option>
                                        <option value={ROLES_USERS.VIEWER}>Просматривающий</option>
                                        <option value={ROLES_USERS.GUEST}>Гость</option>
                                    </select>
                                    <button onClick={(e) => saveRole(item.id, item.role)} className="accept-button"></button>
                                    </>
                                    )
                                    }          
                                </div>
								</td>
							</tr>

                            ))
                            }
                            
                            
                        </tbody>
                    </table>
				</div>
                }
                {!showCurrentUsers && <p>Текущие пользователи проекта.</p>}
                
                {errorUser && <div className="error-message">{errorUser}</div>}

				</div>
			
				<div>
				<h1>Приглашение пользователей в проект</h1>

				<form onSubmit={SearchToInvite} style={{ marginBottom: '1rem' }}>
						<label htmlFor="id_email">Email: </label>				
						<input 
							placeholder="введите email пользователя"
							name="email"
							type="email"
							id="id_email"
							className="input-text"
							value={email}
							onChange={(e) => setEmail(e.target.value)}   
						/>

						&nbsp;&nbsp;
				<button type="submit" disabled={loading} className="toolbar-button">
					{loading ? 'Загрузка...' : 'Найти'}
				</button>
			
				
				{error && <div className="error-message">{error}</div>}
				</form>

				<h1>Найденные пользователи</h1>		
				{usersearch &&
				<div className='table-editor'>
				<table>
                        <thead>
                            <tr>
                                <th>Имя пользователя</th>
                                <th>Email</th>
								<th>Действие</th>
                            </tr>
                        </thead>

                        <tbody>
                            <tr>
                                <td>{usersearch.name}</td>
                                <td>{usersearch.email}</td>
								<td>
                                {visibleInvite ? (
                                    <button onClick={inviteToProject} className='save-button' disabled={loading}>Пригласить в проект</button>
                                ) : (
                                    <button onClick={excludeFromProject} className='cancel-button' disabled={loading}>Исключить из проекта</button>
                                )}
								</td>
							</tr>
                            
                        </tbody>
                    </table>
				</div>
				}
				</div>
    		</div>					
		</div>
		)
}

export { ProjectOpenUsers }
