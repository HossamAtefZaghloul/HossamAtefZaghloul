"use client";

import { useState, useEffect } from "react";
import { Star, Calendar, Clock, DollarSign } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useDispatch } from "react-redux";

interface Artifact {
  _id: number;
  name: string;
  description: string;
  image: string;
  auctionStartDate: string;
  startingPrice: number;
}

const formatCountdown = (timeLeft: number) => {
  const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
  const hours = Math.floor(
    (timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
  );
  const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

  return `${days}d ${hours}h ${minutes}m ${seconds}s`;
};

const StarArtifact = ({ artifact }: { artifact: Artifact }) => {
  const [countdown, setCountdown] = useState("");
  const dispatch = useDispatch();

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const auctionStart = new Date(artifact.auctionStartDate).getTime();
      const timeLeft = auctionStart - now;
      if (timeLeft > 0) {
        setCountdown(formatCountdown(timeLeft));
      } else {
        setCountdown("Auction has started!");
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [artifact.auctionStartDate, dispatch]);
  return (
    <div className="bg-primary text-primary-foreground p-6 rounded-lg shadow-lg mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">{artifact.name}</h2>
        <Star className="w-8 h-8 text-yellow-300" />
      </div>
      <div className="flex items-center justify-center w-full h-[400px] object-cover rounded-md mb-4 bg-white">
        <img
          src={artifact.image}
          alt={artifact.name}
          className="w-full h-full rounded "
        />
      </div>

      <p className="mb-4">{artifact.description}</p>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          <Calendar className="w-5 h-5 mr-2" />
          <span>{new Date(artifact.auctionStartDate).toLocaleString()}</span>
        </div>
        <div className="flex items-center">
          <span>Starting with ${artifact.startingPrice.toLocaleString()}</span>
        </div>
      </div>
      <div className="flex items-center text-lg font-semibold">
        <Clock className="w-5 h-5 mr-2" />
        <span>{countdown}</span>
      </div>
    </div>
  );
};

const ArtifactCard = ({ artifact }: { artifact: Artifact }) => (
  <div className="bg-card text-card-foreground p-4 rounded-lg shadow">
    <h3 className="text-lg font-semibold mb-2">{artifact.name}</h3>
    <img
      src={artifact.image}
      alt={artifact.name}
      className="w-full h-40 object-cover rounded-md mb-2"
    />
    <p className="text-sm mb-2">{artifact.description}</p>
    <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
      <div className="flex items-center">
        <Calendar className="w-4 h-4 mr-1" />
        <span>{new Date(artifact.auctionStartDate).toLocaleString()}</span>
      </div>
      <div className="flex items-center">
        <DollarSign className="w-4 h-4 mr-1" />
        <span>{artifact.startingPrice.toLocaleString()}</span>
      </div>
    </div>
  </div>
);

export default function ArtifactsAuctionPage() {
  const [upcomingArtifact, setUpcomingArtifact] = useState<Artifact | null>(null);
  const [remainingArtifacts, setRemainingArtifacts] = useState<Artifact[]>([]);

  const fetchArtifacts = async () => {
    const { data } = await axios.get("/api/getItems");
    return data;
  };

  const { data, isLoading, error } = useQuery<Artifact[]>({
    queryKey: ["artifacts"],
    queryFn: fetchArtifacts,
  });

  useEffect(() => {
    if (data) {
      const sortedArtifacts = [...data].sort(
        (a, b) =>
          new Date(a.auctionStartDate).getTime() -
          new Date(b.auctionStartDate).getTime()
      );

      const nextArtifact =
        sortedArtifacts.find(
          (artifact) => new Date(artifact.auctionStartDate) > new Date()
        ) || null;

      setUpcomingArtifact(nextArtifact);

      setRemainingArtifacts(
        sortedArtifacts.filter((artifact) => artifact._id !== nextArtifact?._id)
      );
    }
  }, [data]);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading artifacts!</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Artifact Auctions</h1>

      {upcomingArtifact && <StarArtifact artifact={upcomingArtifact} />}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {remainingArtifacts.map((artifact) => (
          <ArtifactCard key={artifact._id} artifact={artifact} />
        ))}
      </div>
    </div>
  );
}


