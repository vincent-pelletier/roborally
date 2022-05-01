import flag from '../assets/Flag.png';
import heart from '../assets/Heart.png';
import noFlag from '../assets/NoFlag.png';
import './robotdetail.css';

const RobotDetail = ({robot}) => {

    return (
        <div className={"robot-detail " + robot.player.color}>
            <table>
                <tbody>
                    <tr>
                        <td rowSpan="2">
                            <img src={robot.src} alt={robot.name} className="mini-robot" draggable="false"/>
                        </td>
                        <td>
                            {robot.player.name}
                        </td>
                        <td className="right">
                            {Array(3).fill().map((_, i) => <img key={i} src={robot.flags > i ? flag : noFlag} alt={i} className="flag" draggable="false"/>)}
                        </td>
                    </tr>
                    <tr>
                        <td colSpan="2">
                            {Array(robot.hp).fill().map((_, i) => <img key={i} src={heart} alt={i} className="heart" draggable="false"/>)}
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    );
};

export default RobotDetail;