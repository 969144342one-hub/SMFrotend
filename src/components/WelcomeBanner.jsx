import React from "react";
import logo from "./../assets/81F+YQ4RWyL._AC_UF894,1000_QL80_.jpg";
import "./Comman.css"; // <-- add CSS file

const WelcomeBanner = () => {
  return (
    <div className="welcome-banner" >
      <h1 className="header-welocme">!! Welcome !! </h1>
      <img className="banner-logo" src={logo} alt="Logo" />
      <h3 style={{color:"black"}}>Fast Satta Matka Live Result</h3>
      {/* <div className="banner-text"> */}

        {/* change p to div */}
        {/* <div className="welcome-message"> */}
          {/* <strong>!! Welcome to !!</strong> */}
          {/* <br /> */}

          {/* logo-block can stay as div */}
          {/* <div className="logo-block">
            <span className="logo-dp">Satta Matka Aajj Tak</span>
            {/* <span className="logo-dp">Matka Aajj Tak</span> */}
          {/* </div>  */}

          {/* Fastest Satta Matka Results | Live Jodi • Panel • Fix Games */}
        {/* </div> */}

      {/* </div> */}
    </div>
  );
};

export default WelcomeBanner;
