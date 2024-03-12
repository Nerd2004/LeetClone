import { useState, useEffect } from "react";

type CountdownProps = {
  startTime: number; // Provide the start time in milliseconds
  endTime: number; // Provide the end time in milliseconds
};

const Countdown: React.FC<CountdownProps> = ({ startTime, endTime }) => {
  const [alertShown, setAlertShown] = useState(false);
  const calculateTimeRemaining = () => {
    const now = Date.now();
    if (now < startTime) {
      return startTime - now;
    } else if (now < endTime) {
      return endTime - now;
    } else {
      return 0;
    }
  };

  const [timeRemaining, setTimeRemaining] = useState<number>(
    calculateTimeRemaining()
  );

  useEffect(() => {
    const intervalId = setInterval(() => {
      const remaining = calculateTimeRemaining();
      setTimeRemaining(remaining);
      if (!alertShown && remaining < 1000 && Date.now() < endTime) {
        setAlertShown(true);
        alert("Contest has started!");
        window.location.reload();
      }
    }, 1000);

    return () => clearInterval(intervalId); // Cleanup on unmount
  }, [startTime, endTime, alertShown]);

  const hours = Math.floor(timeRemaining / (1000 * 60 * 60));
  const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000);

  // Format time parts with leading zeros and colons
  const formattedTime = `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

  return <div>{formattedTime}</div>;
};

export default Countdown;
