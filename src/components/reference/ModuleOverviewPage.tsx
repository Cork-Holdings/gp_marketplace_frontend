import { Link, Navigate, useParams } from "react-router-dom";
import { useMarketplace } from "@/lib/context/useMarketplace";
import { usePermissions } from "@/lib/context/permissions";
import { usePlan } from "@/lib/context/plan";
import { useMarketplaceCapabilities } from "@/hooks/useMarketplaceCapabilities";
import { canAccessNav } from "@/lib/permissions";
import { planFeatureForPath } from "@/lib/platform";
import {
  moduleAccess,
  modulePath,
  modulesForRole,
  type WorkspaceRole,
} from "@/lib/erpModules";
import {
  adminReferenceMenu,
  ownerReferenceMenu,
} from "@/lib/referenceNavigation";
import { ReferenceIcon } from "./ReferenceIcon";
import { ModuleSnapshot } from "./ModuleSnapshot";
import "./module-overview.css";

export function ModuleOverviewPage({ role }: { role: WorkspaceRole }) {
  const { moduleId } = useParams();
  const modules = modulesForRole(role).filter(
    (item) => item[role]!.paths.length > 0,
  );
  const module = modules.find((item) => item.id === moduleId);
  const { permissions, loading: permissionsLoading } = usePermissions();
  const { data: plan, error: planError, refresh } = usePlan();
  const { selectedStore } = useMarketplace();
  const { isFood } = useMarketplaceCapabilities(selectedStore);
  const menu = role === "owner" ? ownerReferenceMenu : adminReferenceMenu;
  if (moduleId && !module)
    return (
      <section className="module-page">
        <h1>Module not found</h1>
        <Link to={modulePath(role)}>Explore modules</Link>
      </section>
    );
  if (!module) return <Navigate to={`/portal/${role}`} replace />;
  const scope = module[role]!;
  const candidates = menu.filter(
    (item) =>
      !item.comingSoon &&
      scope.paths.includes(item.to) &&
      (!item.foodOnly || isFood || role === "admin"),
  );
  const access = candidates.map((item) => ({
    item,
    state: moduleAccess({
      permitted: canAccessNav(permissions, item.to),
      permissionsLoading,
      planFeature: role === "owner" ? planFeatureForPath(item.to) : undefined,
      planFeatures: plan?.plan.data.features,
      planError: Boolean(planError),
    }),
  }));
  const available = access.filter(({ state }) => state === "available");
  const checking = access.some(({ state }) => state === "checking");
  const planFailed = access.some(({ state }) => state === "plan-error");
  return (
    <section className="module-page">
      <Link className="module-back" to={`/portal/${role}`}>
        ← Dashboard
      </Link>
      <header className="module-heading">
        <p className="module-eyebrow">
          {module.additional ? "Additional business tools" : "Business module"}
        </p>
        <h1>{scope.title ?? module.title}</h1>
        <p>{scope.description ?? module.description}</p>
      </header>
      <ModuleSnapshot role={role} moduleId={module.id} />
      <section
        className="module-section"
        aria-labelledby="module-available"
        aria-busy={checking}
      >
        <header>
          <h2 id="module-available">Available now</h2>
          <p>Access depends on your role, selected branch and active plan.</p>
        </header>
        {available.length ? (
          <ul className="module-working-list">
            {available.map(({ item }) => (
              <li key={item.to}>
                <div className="module-working-name">
                  <ReferenceIcon name={item.icon} />
                  <strong>{item.label}</strong>
                </div>
                <Link to={item.to} aria-label={`Open ${item.label}`}>
                  Open <ReferenceIcon name="arrow" size={16} />
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="module-empty" role="status">
            {checking
              ? "Checking available tools…"
              : planFailed
                ? "Plan check failed"
                : "No tools are available for your current access."}
          </p>
        )}
        {planFailed && (
          <div className="module-access" role="status">
            <span>Plan access could not be checked.</span>
            <button type="button" onClick={refresh}>
              Retry plan check
            </button>
          </div>
        )}
      </section>
      {role === "owner" && !selectedStore && (
        <p className="module-footnote">
          Select a branch before opening business tools.{" "}
          <Link to="/portal/owner/stores">Open Stores</Link>
        </p>
      )}
    </section>
  );
}

export function BusinessModuleDirectory({ role }: { role: WorkspaceRole }) {
  const { permissions, loading } = usePermissions();
  const { data: plan } = usePlan();
  const { selectedStore } = useMarketplace();
  const { isFood } = useMarketplaceCapabilities(selectedStore);
  const menu = role === "owner" ? ownerReferenceMenu : adminReferenceMenu;
  const entries = modulesForRole(role)
    .map((module) => ({
      module,
      items: menu.filter(
        (item) =>
          !item.comingSoon &&
          module[role]!.paths.includes(item.to) &&
          (!item.foodOnly || isFood || role === "admin") &&
          canAccessNav(permissions, item.to) &&
          (role === "admin" ||
            !planFeatureForPath(item.to) ||
            plan?.plan.data.features.includes(planFeatureForPath(item.to)!)),
      ),
    }))
    .filter((entry) => entry.items.length);
  return (
    <section
      className="module-dashboard-directory"
      id="business-modules"
      aria-labelledby="business-modules-title"
    >
      <header>
        <h2 id="business-modules-title">Business modules</h2>
        <p>Open a module for its current activity and available tools.</p>
      </header>
      {loading ? (
        <p role="status">Checking available tools…</p>
      ) : (
        <div className="module-directory">
          {entries.map(({ module, items }) => (
            <Link
              key={module.id}
              to={modulePath(role, module.id)}
              className="module-directory-link"
            >
              <ReferenceIcon name={module.icon} size={24} />
              <span>
                <strong>{module[role]!.title ?? module.title}</strong>
                <small>
                  {items.length} available{" "}
                  {items.length === 1 ? "tool" : "tools"}
                </small>
              </span>
              <ReferenceIcon name="arrow" size={18} />
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
