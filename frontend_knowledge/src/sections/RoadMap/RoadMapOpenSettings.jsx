import { useState } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import { API } from "../../apiAxios/apiAxios"

import { RoadMapDeleteModal } from './RoadMapDeleteModal'



function RoadMapOpenSettings() {

	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);

    

    //состояние для отображения информации об удалении проекта
    const [visibleInfoDelete, setVisibleInfoDelete] = useState(false)

	const { roadmap_id } = useParams()


    const navigate = useNavigate();
    

    const [modalOpen, setModalOpen] = useState(false);

    const deleteRoadMap = async () => {
        setLoading(true);
        try {           
            const response = await API.delete(`http://127.0.0.1:8000/delete_roadmap/${roadmap_id}`);
            setLoading(false);
            
            if (response.statusText==='OK') {
                console.log("Мап удален!")
                setModalOpen(false);
                navigate("/roadmaps/");                      
            } else {
                const errorData = await response.data
                console.log(errorData, 'тут ошибка')     
            }
        } catch (error) {
            setLoading(false);
            console.log(error)            
            setError(error.error_code);//в error прокидывается то что пишем в detail, почему-то
        }    
    }

    const openModalClick = () => {      
      setModalOpen(true);
      };


	return (
		<div className="header-chapter">
			
            <h1>Информация об удалении дорожной карты</h1>
            <button className='toolbar-button' onClick={() => {setVisibleInfoDelete(!visibleInfoDelete);}}>Развернуть</button>
            {visibleInfoDelete && 
                <div>
                    <h3>Вы можете полностью отредактировать текущую мапу для других целей или удалить ее по кнопке ниже. При удалении будут удалены все вложенные разделы и этапы в них без возможности восстановления.</h3>
                    <button className='cancel-button' onClick={openModalClick}>Удалить</button>
                </div>
            }



            {modalOpen && (
                <RoadMapDeleteModal               
                  onClose={() => setModalOpen(false)}
                  onSuccess={deleteRoadMap}
                  error={error}
                />
              )}


		</div>
		)
}




export { RoadMapOpenSettings }
