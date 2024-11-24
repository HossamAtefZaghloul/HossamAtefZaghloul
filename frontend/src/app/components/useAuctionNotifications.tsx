import { useEffect } from "react";
import { useDispatch } from "react-redux";
import socket  from "../../utils/socket";
import { showNotification } from "../store/notificationSlice";

const useAuctionNotifications = () => {
  const dispatch = useDispatch();
  useEffect(() => {
    socket.on("auction-start", () => {
      dispatch(showNotification(`Auction is starting now!`));
    console.log('hii33123131312')
    });

    return () => {
        socket.off("auction-start");
    };
  }, [dispatch]);
};

export default useAuctionNotifications;