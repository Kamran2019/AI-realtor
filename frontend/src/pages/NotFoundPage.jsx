import { Link } from "react-router-dom";

const NotFoundPage = () => (
  <section className="not-found-page">
    <p className="eyebrow">404</p>
    <h1>Page not found</h1>
    <p>This route does not exist.</p>
    <Link to="/">Return home</Link>
  </section>
);

export default NotFoundPage;
