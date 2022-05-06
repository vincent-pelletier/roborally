import React from 'react';
import robo1 from '../assets/Robo1.png';
import robo2 from '../assets/Robo2.png';
import robo3 from '../assets/Robo3.png';
import robo4 from '../assets/Robo4.png';
import robo5 from '../assets/Robo5.png';
import robo6 from '../assets/Robo6.png';
import './robot.css';

const Robot = ({robot, positionX, positionY}) => {

    const robotSrcs = [robo1, robo2, robo3, robo4, robo5, robo6];

    return (
        <img src={robotSrcs[robot.id]} alt={robot.name} draggable="false"
            className={'robo direction' + robot.direction + (robot.rebooting ? ' rebooting' : '')}
            style={{top: positionY[robot.y] + "px", left: positionX[robot.x] + "px"}} />
    );
};

export default Robot;