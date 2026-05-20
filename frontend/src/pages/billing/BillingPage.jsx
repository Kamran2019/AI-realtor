import { useEffect, useMemo, useState } from "react";
import { createCheckout, createPortal } from "../../services/billingApi.js";
import { useAuth } from "../../context/AuthContext.jsx";

const plans = [
  {
    key: "starter",
    name: "Starter",
    summary: "For individual agents getting organized.",
    monthly: "$29",
    yearly: "$290",
    features: ["15 active listings", "25 inspections per month", "2 team members"]
  },
  {
    key: "pro",
    name: "Pro",
    summary: "For growing teams with steady deal flow.",
    monthly: "$79",
    yearly: "$790",
    features: ["100 active listings", "250 inspections per month", "10 team members"]
  },
  {
    key: "enterprise",
    name: "Enterprise",
    summary: "For brokerages that need room to scale.",
    monthly: "$199",
    yearly: "$1,990",
    features: ["Unlimited listings", "Unlimited inspections", "Unlimited team members"]
  }
];

const getErrorMessage = (error, fallback) => error.response?.data?.message || fallback;

const BillingPage = () => {
  const { loadMe, user } = useAuth();
  const [interval, setInterval] = useState("monthly");
  const [error, setError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [loadingAction, setLoadingAction] = useState("");

  useEffect(() => {
    loadMe().catch(() => {});
  }, [loadMe]);

  const subscription = user?.subscription || {};
  const currentPlan = subscription.plan || "free";
  const currentStatus = subscription.status || "inactive";
  const periodEnd = useMemo(() => {
    if (!subscription.currentPeriodEnd) {
      return null;
    }

    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium"
    }).format(new Date(subscription.currentPeriodEnd));
  }, [subscription.currentPeriodEnd]);

  const handleCheckout = async (plan) => {
    setError("");
    setStatusMessage("");
    setLoadingAction(`checkout:${plan}`);

    try {
      const response = await createCheckout({ interval, plan });

      window.location.assign(response.data.data.url);
    } catch (checkoutError) {
      setError(getErrorMessage(checkoutError, "Unable to start checkout."));
    } finally {
      setLoadingAction("");
    }
  };

  const handlePortal = async () => {
    setError("");
    setStatusMessage("");
    setLoadingAction("portal");

    try {
      const response = await createPortal();

      window.location.assign(response.data.data.url);
    } catch (portalError) {
      setError(getErrorMessage(portalError, "Unable to open the billing portal."));
    } finally {
      setLoadingAction("");
    }
  };

  const refreshBilling = async () => {
    setError("");
    setStatusMessage("");
    setLoadingAction("refresh");

    try {
      await loadMe();
      setStatusMessage("Billing status refreshed.");
    } catch (refreshError) {
      setError("Unable to refresh billing status.");
    } finally {
      setLoadingAction("");
    }
  };

  return (
    <section className="billing-page" aria-labelledby="billing-title">
      <div className="billing-header">
        <div>
          <p className="eyebrow">Billing</p>
          <h1 id="billing-title">Subscription</h1>
          <p>Manage plan access and open Stripe-hosted billing tools.</p>
        </div>
        <div className="billing-status" aria-label="Current subscription">
          <span>Current plan</span>
          <strong>{currentPlan}</strong>
          <small>{currentStatus}</small>
          {periodEnd ? <small>Renews {periodEnd}</small> : null}
        </div>
      </div>

      <div className="billing-actions">
        <div className="interval-toggle" aria-label="Billing interval">
          <button
            className={interval === "monthly" ? "active" : ""}
            onClick={() => setInterval("monthly")}
            type="button"
          >
            Monthly
          </button>
          <button
            className={interval === "yearly" ? "active" : ""}
            onClick={() => setInterval("yearly")}
            type="button"
          >
            Yearly
          </button>
        </div>
        <button
          className="secondary-button"
          disabled={loadingAction === "portal"}
          onClick={handlePortal}
          type="button"
        >
          {loadingAction === "portal" ? "Opening..." : "Billing portal"}
        </button>
        <button
          className="secondary-button"
          disabled={loadingAction === "refresh"}
          onClick={refreshBilling}
          type="button"
        >
          Refresh
        </button>
      </div>

      {error ? <p className="form-error">{error}</p> : null}
      {statusMessage ? <p className="form-success">{statusMessage}</p> : null}

      <div className="plan-grid">
        {plans.map((plan) => {
          const isCurrentPlan = currentPlan === plan.key;
          const price = interval === "monthly" ? plan.monthly : plan.yearly;
          const actionKey = `checkout:${plan.key}`;

          return (
            <article className="plan-card" key={plan.key}>
              <div>
                <h2>{plan.name}</h2>
                <p>{plan.summary}</p>
              </div>
              <div className="plan-price">
                <strong>{price}</strong>
                <span>/{interval === "monthly" ? "mo" : "yr"}</span>
              </div>
              <ul>
                {plan.features.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
              <button
                className={isCurrentPlan ? "secondary-button" : "primary-button"}
                disabled={loadingAction === actionKey}
                onClick={() => handleCheckout(plan.key)}
                type="button"
              >
                {loadingAction === actionKey ? "Redirecting..." : isCurrentPlan ? "Change plan" : "Upgrade"}
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
};

export default BillingPage;
