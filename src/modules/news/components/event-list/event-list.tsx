import type { CommunityEvent } from "@/modules/news/types";
import "./event-list.scss";

interface EventListProps {
  events: CommunityEvent[];
  emptyMessage: string;
}

function formatEventDate(startsAt: string) {
  return new Date(startsAt).toLocaleString("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function EventList({ events, emptyMessage }: EventListProps) {
  if (events.length === 0) {
    return <p className="event-list__empty">{emptyMessage}</p>;
  }

  return (
    <ul className="event-list">
      {events.map((event) => {
        const isFull = event.capacity !== null && event.participantCount >= event.capacity;

        return (
          <li className="event-list__item" key={event.id}>
            <article className="event-list__card">
              <header className="event-list__head">
                <h2 className="event-list__title">{event.title}</h2>
                {isFull && <span className="event-list__badge">Đã đủ người</span>}
              </header>

              <p className="event-list__description">{event.description}</p>

              <dl className="event-list__details">
                <div className="event-list__detail">
                  <dt className="event-list__detail-label">Thời gian</dt>
                  <dd className="event-list__detail-value">
                    <time dateTime={event.startsAt}>{formatEventDate(event.startsAt)}</time>
                  </dd>
                </div>
                <div className="event-list__detail">
                  <dt className="event-list__detail-label">Địa điểm</dt>
                  <dd className="event-list__detail-value">{event.location}</dd>
                </div>
                <div className="event-list__detail">
                  <dt className="event-list__detail-label">Người tham gia</dt>
                  <dd className="event-list__detail-value">
                    {event.capacity === null
                      ? `${event.participantCount} người`
                      : `${event.participantCount}/${event.capacity} người`}
                  </dd>
                </div>
              </dl>
            </article>
          </li>
        );
      })}
    </ul>
  );
}

export { EventList };
export type { EventListProps };
