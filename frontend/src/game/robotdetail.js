import flag from '../assets/Flag.png';
import heart from '../assets/Heart.png';
import noFlag from '../assets/NoFlag.png';
import robo1 from '../assets/Robo1.png';
import robo2 from '../assets/Robo2.png';
import robo3 from '../assets/Robo3.png';
import robo4 from '../assets/Robo4.png';
import robo5 from '../assets/Robo5.png';
import robo6 from '../assets/Robo6.png';
import './robotdetail.css';

const RobotDetail = ({robot}) => {

    const robotSrcs = [robo1, robo2, robo3, robo4, robo5, robo6];

    return (
        <div className={"robot-detail " + robot.player.color}>
            <table>
                <tbody>
                    <tr>
                        <td rowSpan="2">
                            <img src={robotSrcs[robot.id]} alt={robot.id} className="mini-robot" draggable="false"/>
                        </td>
                        <td width="87px">
                            {robot.player.name}
                        </td>
                        <td className="right">
                            {Array(3).fill().map((_, i) => <img key={i} src={robot.flags > i ? flag : noFlag} alt={i} className="flag" draggable="false"/>)}
                        </td>
                    </tr>
                    <tr>
                        <td colSpan="2" height="21px">
                            {Array(robot.hp).fill().map((_, i) => <img key={i} src={heart} alt={i} className="heart" draggable="false"/>)}
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    );
};

export default RobotDetail;