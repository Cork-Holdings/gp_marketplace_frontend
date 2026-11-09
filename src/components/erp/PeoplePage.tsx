import { useState } from "react";
import { Link } from "react-router-dom";
import api from "@/lib/api/crud";
import { RecordListTable } from "@/components/common/RecordListTable";
import {
  ERPLayout,
  Section,
  Loading,
  Field,
  FormPanel,
  Status,
  Feedback,
  Refresh,
} from "./ERPShared";
import { useERP, useAction } from "./useERP";
import { endpoint, day, type Contact, type PeopleRecord } from "./erp";
export default function PeoplePage() {
  const records = useERP<PeopleRecord>("people");
  return (
    <ERPLayout
      title="People"
      description="Leave requests and simple attendance using your existing team identities."
      action={<Refresh onClick={records.refresh} />}
    >
      {records.store && (
        <People key={records.store} store={records.store} records={records} />
      )}
    </ERPLayout>
  );
}
function People({
  store,
  records,
}: {
  store: string;
  records: ReturnType<typeof useERP<PeopleRecord>>;
}) {
  const employees = useERP<Contact>("employees"),
    action = useAction();
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [employee, setEmployee] = useState(""),
    [kind, setKind] = useState("leave"),
    [start, setStart] = useState(day()),
    [end, setEnd] = useState(day()),
    [detail, setDetail] = useState("");
  return (
    <>
      <p className="erp-hint">
        Confidential HR access is separate from ordinary Team access. Payroll is
        not included. Approved leave blocks new booking and service-visit slots.
        Check the <Link to="/portal/owner/bookings">team calendar</Link> first:
        existing commitments must be resolved before overlapping leave can be
        approved.
      </p>
      <Section
        title="Employee directory"
        action={<Link to="/portal/owner/team">Manage team →</Link>}
      >
        <div className="erp-pad">
          <p>
            {employees.items
              ? `${employees.items.length} active team members available to this branch`
              : "Loading team members…"}
            . These are the same people shown in Team. Leave and attendance
            records are listed separately below.
          </p>
          <Field label="Find an employee">
            <input
              type="search"
              value={employeeSearch}
              maxLength={120}
              onChange={(e) => setEmployeeSearch(e.target.value)}
              placeholder="Name, employee ID or role"
            />
          </Field>
        </div>
        <Loading {...employees} retry={employees.refresh} />
        {!!employees.items?.length && (
          <div className="erp-scroll">
            <RecordListTable
              className="erp-table"
              aria-label="Employee directory"
            >
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Employee ID</th>
                  <th>Role</th>
                  <th>Branch access</th>
                </tr>
              </thead>
              <tbody>
                {employees.items
                  .filter((person) =>
                    `${person.name} ${person.employee_number ?? ""} ${person.role ?? ""}`
                      .toLowerCase()
                      .includes(employeeSearch.toLowerCase()),
                  )
                  .map((person) => (
                    <tr key={person.id}>
                      <td>
                        <strong>{person.name}</strong>
                      </td>
                      <td>{person.employee_number ?? "—"}</td>
                      <td>{person.role}</td>
                      <td>{person.branch_scope ?? "This branch"}</td>
                    </tr>
                  ))}
              </tbody>
            </RecordListTable>
            {!employees.items.some((person) =>
              `${person.name} ${person.employee_number ?? ""} ${person.role ?? ""}`
                .toLowerCase()
                .includes(employeeSearch.toLowerCase()),
            ) && <p className="erp-empty">No employees match this search.</p>}
          </div>
        )}
      </Section>
      <Feedback {...action} />
      <FormPanel title="Record leave or attendance">
        <form
          className="erp-form"
          onSubmit={(e) => {
            e.preventDefault();
            void action.run(
              async () => {
                await api.post(endpoint(store, "people"), {
                  employee_id: employee,
                  kind,
                  starts_on: start,
                  ends_on: end,
                  detail,
                });
                setDetail("");
                records.refresh();
              },
              kind === "leave"
                ? "Leave request recorded for review."
                : "Attendance recorded.",
            );
          }}
        >
          <div className="erp-form-grid">
            <Field label="Employee">
              <select
                required
                value={employee}
                onChange={(e) => setEmployee(e.target.value)}
              >
                <option value="">Choose an employee</option>
                {employees.items?.map((e) => (
                  <option value={e.id} key={e.id}>
                    {e.name} · {e.role}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Record type">
              <select value={kind} onChange={(e) => setKind(e.target.value)}>
                <option value="leave">Leave request</option>
                <option value="attendance">Attendance</option>
              </select>
            </Field>
            <Field label="Start date">
              <input
                required
                type="date"
                value={start}
                onChange={(e) => setStart(e.target.value)}
              />
            </Field>
            <Field label="End date">
              <input
                required
                type="date"
                min={start}
                value={end}
                onChange={(e) => setEnd(e.target.value)}
              />
            </Field>
          </div>
          <Field label="Details">
            <textarea
              required
              maxLength={1000}
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              placeholder={
                kind === "leave"
                  ? "Leave type and reason"
                  : "Hours worked or attendance notes"
              }
            />
          </Field>
          <button disabled={action.busy || !employee || end < start}>
            Save people record
          </button>
        </form>
      </FormPanel>
      <Section title="Leave & attendance records">
        {records.items?.length === 0 ? (
          <p className="erp-empty">
            No leave or attendance has been recorded yet. Your employees are
            listed in the directory above.
          </p>
        ) : (
          <Loading {...records} retry={records.refresh} />
        )}
        <div className="erp-scroll">
          <RecordListTable className="erp-table" aria-label="People records">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Record</th>
                <th>Dates</th>
                <th>Status</th>
                <th>Decision</th>
              </tr>
            </thead>
            <tbody>
              {records.items?.map((r) => (
                <tr key={r.id}>
                  <td>{r.employee_name}</td>
                  <td>
                    {r.kind}
                    <small>{r.detail}</small>
                  </td>
                  <td>
                    {r.starts_on.slice(0, 10)} – {r.ends_on.slice(0, 10)}
                  </td>
                  <td>
                    <Status value={r.status} />
                  </td>
                  <td>
                    {r.status === "requested" ? (
                      <div className="erp-actions">
                        <button
                          disabled={action.busy}
                          onClick={() =>
                            void action.run(async () => {
                              await api.patch(
                                endpoint(store, `people/${r.id}`),
                                { status: "approved" },
                              );
                              records.refresh();
                            }, "Leave approved. This employee's time is now unavailable for new bookings and service visits.")
                          }
                        >
                          Approve
                        </button>
                        <button
                          className="erp-secondary"
                          disabled={action.busy}
                          onClick={() =>
                            void action.run(async () => {
                              await api.patch(
                                endpoint(store, `people/${r.id}`),
                                { status: "declined" },
                              );
                              records.refresh();
                            }, "Leave declined.")
                          }
                        >
                          Decline
                        </button>
                      </div>
                    ) : (
                      "Recorded"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </RecordListTable>
        </div>
      </Section>
    </>
  );
}
