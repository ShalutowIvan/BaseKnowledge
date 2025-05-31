import React, { useEffect, useState } from "react";
import axios from "axios";
import Cookies from "js-cookie";

const Profile = () => {
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchUserData = async () => {
      // try {
        // Получаем куку с токеном
        const token = Cookies.get("Authorization");
        console.log(token)

      //   if (!token) {
      //     setError("No token found. Please log in.");
      //     return;
      //   }

      //   // Запрос к защищенному эндпоинту FastAPI
      //   const response = await axios.get("http://localhost:8000/users/me", {
      //     headers: {
      //       Authorization: token, // Отправляем токен в заголовке
      //     },
      //   });

      //   // Устанавливаем данные пользователя в состояние
      //   setUser(response.data);
      // } catch (error) {
      //   console.error("Error fetching user data:", error);
      //   setError("Failed to fetch user data. Please try again.");
      // }
    };

    fetchUserData();
  }, []);

  // if (error) {
  //   return <div>{error}</div>;
  // }

  // if (!user) {
  //   return <div>Loading...</div>;
  // }

  return (
    <div>
      <h1>User Profile</h1>
      {/*<p>Username: {user.username}</p>
      <p>Email: {user.email}</p>
      <p>Full Name: {user.full_name}</p>*/}
      <h1>Привет</h1>
    </div>
  );
};

export { Profile };