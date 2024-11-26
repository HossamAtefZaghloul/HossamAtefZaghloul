"use client";
import { useEffect, useState } from "react";
import { Clock, DollarSign, History } from "lucide-react";
import axios from "axios";
import { useSelector } from "react-redux";
import { RootState } from "../store";
import io from "socket.io-client";

interface AuctionData {
  _id: string;
  name: string;
  description: string;
  startingPrice: number;
  currentBid?: number;
  auctionStatus: string;
  image?: string;
  bids?: Array<{
    userId: string;
    userName: string;
    amount: number;
    timestamp: string;
  }>;
}

interface BidData {
  userId: string;
  userName: string;
  amount: number;
  timestamp: string;
}
  const socket = io("http://localhost:5000");

export default function AuctionPage() {
  const [bidAmount, setBidAmount] = useState("");
  const [bids, setBids] = useState<BidData[]>([]);
  const [auction, setAuction] = useState<AuctionData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { userId, email } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    const fetchLiveAuction = async () => {
      try {
        const response = await axios.get("/api/get_live_auction");
        if (response.data.success) {
          setAuction(response.data.data);
        } else {
          setError(response.data.error || "Failed to fetch live auction");
        }
      } catch (err) {
        setError("An error occurred while fetching live auction");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchLiveAuction();
  }, []);

  ////////////////////////////////////////////////////////////////////////////////

  useEffect(() => {
    // Listen for live bid updates
    socket.on("placed-live-bid", (newBid: []) => {
      console.log("Received new live bids:", newBid);
    });

    // Cleanup the listener on component unmount
    return () => {
      socket.off("placed-live-bid");
    };
  }, []); // Empty dependency array ensures the listener is registered only once

  const handleBidSubmit = async (id: string) => {
    try {
      const response = await axios.post("/api/place_bid", {
        auctionId: id,
        userId,
        userName: email,
        amount: parseFloat(bidAmount),
      });

      console.log("Bid placed successfully:", response.data);

      // Clear the bid amount input field
      setBidAmount("");
    } catch (err) {
      console.error("Error placing bid:", err);
    }
  };

  useEffect(() => {
    const fetchLiveBids = async () => {
      try {
        const response = await axios.get("/api/get_live_bids");
        if (response.data.success && response.data.bids) {
          setBids(response.data.bids);
        } else {
          console.log("No live bids found.");
        }
      } catch (err) {
        console.error("Error fetching live bids:", err);
      }
    };

    fetchLiveBids();

  }, []);


  useEffect(() => {
    socket.on("new-live-bids", (liveBids: BidData) => {
      console.log('dsfsdfsdfdsf');
      console.log(liveBids);
      setBids((prevBids) => [...prevBids, liveBids]);
    });
   
    return () => {
      socket.off("new-live-bids");
    };
  }, []);
  

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Exclusive Single Item Auction
          </h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Auction Item Details */}
            <div className="md:w-1/2">
              <img
                src={auction?.image}
                alt={auction?.name}
                className="w-auto h-auto rounded-lg shadow-lg"
              />
            </div>

            <div className="md:w-1/2 space-y-6">
              <div>
                <h2 className="text-2xl font-semibold text-gray-900">
                  {auction?.name}
                </h2>
                <p className="mt-2 text-gray-600">{auction?.description}</p>
              </div>

              {/* Bid Section */}
              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <DollarSign className="h-6 w-6 text-green-500 mr-2" />
                    <span className="text-2xl font-bold text-gray-900">
                      {auction?.currentBid || auction?.startingPrice}
                    </span>
                  </div>
                  <div className="flex items-center text-gray-500">
                    <Clock className="h-5 w-5 mr-1" />
                    <span>2h 15m left</span>
                  </div>
                </div>

                <form
                  className="mt-6"
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleBidSubmit(auction?._id || "");
                  }}
                >
                  <div className="flex items-center">
                    <input
                      type="number"
                      placeholder="Enter your bid"
                      value={bidAmount}
                      onChange={(e) => setBidAmount(e.target.value)}
                      className="flex-grow mr-2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                      Place Bid
                    </button>
                  </div>
                </form>
              </div>

              {/* Bid History */}
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <History className="h-6 w-6 mr-2 text-indigo-500" />
                  Bid History
                </h3>
                <ul className="divide-y divide-gray-200">
                  {bids && auction &&
                    bids
                      .slice()
                      .reverse()
                      .map((bid, index) => (
                        <li key={index} className="px-6 py-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {bid.userName}
                              </p>
                              <p className="text-sm text-gray-500">
                                {new Date(bid.timestamp).toLocaleString()}
                              </p>
                            </div>
                            <p className="text-sm font-semibold text-green-600">
                            ${bid.amount ? bid.amount.toFixed(2) : '0.00'}
                            </p>
                          </div>
                        </li>
                      ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
