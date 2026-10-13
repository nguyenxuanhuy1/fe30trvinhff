"use client";

import Image from "next/image";
import Link from "next/link";
import axios from "axios";
import { useEffect, useState } from "react";
import { getRooms } from "@/modules/lessons";
import type { Room } from "@/modules/lessons";
import { roomsPage } from "./rooms.const";
import "./rooms.scss";

function RoomsView() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    // Bọc async để setState chỉ chạy trong callback, tránh setState đồng bộ trong effect
    async function loadRooms() {
      try {
        setRooms(await getRooms());
      } catch (error) {
        setLoadError(getErrorMessage(error, roomsPage.loadFailed));
      } finally {
        setIsLoading(false);
      }
    }

    void loadRooms();
  }, []);

  if (isLoading) {
    return (
      <section className="rooms">
        <p className="rooms__loading">{roomsPage.loading}</p>
      </section>
    );
  }

  return (
    <section className="rooms">
      <header className="rooms__header">
        <h1 className="rooms__title">{roomsPage.title}</h1>
        <p className="rooms__description">{roomsPage.description}</p>
      </header>

      <div className="rooms__section">
        {loadError !== null ? (
          <p className="rooms__empty">{loadError}</p>
        ) : rooms.length === 0 ? (
          <p className="rooms__empty">{roomsPage.hints.empty}</p>
        ) : (
          <ul className="rooms__grid">
            {rooms.map((room) => (
              <li className="rooms__item" key={room.id}>
                <Link className="rooms__link" href={`/phong/${room.id}`}>
                  <span className="rooms__media">
                    {room.imageUrl ? (
                      <Image
                        className="rooms__image"
                        src={room.imageUrl}
                        alt={room.name}
                        width={640}
                        height={360}
                        sizes="320px"
                        unoptimized
                      />
                    ) : (
                      <span className="rooms__placeholder">{roomsPage.hints.noImage}</span>
                    )}
                  </span>
                  <span className="rooms__body">
                    <span className="rooms__name">{room.name}</span>
                    <span className="rooms__count">
                      {roomsPage.lessons(room._count.lessons)}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function getErrorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message;
    if (typeof message === "string" && message.length > 0) return message;
  }
  return fallback;
}

export { RoomsView };
