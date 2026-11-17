import { Routes, Route, Navigate } from 'react-router-dom';
import {lazy,Suspense} from 'react';
import { ProtectedRoute } from '@/lib/ProtectedRoute';
import type { AccountType } from '@/types/auth';
import { PortalDashboardLayout } from './layouts/PortalDashboardLayout';
import { PublicHubLayout } from './layouts/PublicHubLayout';
import { PublicStorefrontLayout } from './layouts/PublicStorefrontLayout';
import { CustomerAccountLayout } from './layouts/CustomerAccountLayout';
import { MarketplaceProvider, MarketplaceBootstrap } from '@/lib/context/marketplace';
import { PermissionsProvider } from '@/lib/context/permissions';
import { PERM } from '@/lib/permissions';

import MarketplaceHomePage from '@/(public)/marketplace/MarketplaceHomePage';
import StorefrontPage from '@/(public)/storefront/StorefrontPage';
import CheckoutPage from '@/(public)/checkout/CheckoutPage';
import OrderTrackingPage from '@/(public)/orders/OrderTrackingPage';
import QRLandingPage from '@/(public)/qr/QRLandingPage';
import PortalLoginPage from '@/(public)/login/PortalLoginPage';
import PasswordRecoveryPage from '@/(public)/login/PasswordRecoveryPage';
import PortalHomePage from './components/portal/PortalHomePage';
import MerchantSelfRegisterPage from '@/(public)/register/MerchantSelfRegisterPage';
import CustomerRegisterPage from '@/(public)/register/CustomerRegisterPage';
import { CheckoutRedirect } from './components/marketplace/CheckoutRedirect';

import AdminDashboardPage from '@/(admin)/dashboard/AdminDashboardPage';
import AdminStoresPage from '@/(admin)/stores/AdminStoresPage';
import AdminAddStorePage from '@/(admin)/stores/AddStorePage';
import AdminKycPage from '@/(admin)/kyc/KycPage';
import AdminMerchantOnboardPage from '@/(admin)/merchants-onboarding/MerchantOnboardPage';
import PlatformAdminCreatePage from '@/(admin)/platform-admins/PlatformAdminCreatePage';

import OwnerDashboardPage from '@/(owner)/dashboard/OwnerDashboardPage';
import MerchantProductsPage from '@/(owner)/products/ProductsPage';
import MerchantOrdersPage from '@/(owner)/orders/OrdersPage';
import MerchantAddBusinessPage from '@/(owner)/businesses/AddBusinessPage';
import MerchantStoresPage from '@/(owner)/stores/StoresPage';
import MerchantAddStorePage from '@/(owner)/stores/AddStorePage';
import MerchantStoreSettingsPage from '@/(owner)/stores/StoreSettingsPage';
import MerchantMenuCategoriesPage from '@/(owner)/menu/MenuCategoriesPage';
import MerchantTablesPage from '@/(owner)/tables/TablesPage';
import MerchantKitchenDisplayPage from '@/(owner)/orders/KitchenDisplayPage';
import MerchantCounterPage from '@/(owner)/counter/CounterPage';
import MerchantTransactionsPage from '@/(owner)/transactions/MerchantTransactionsPage';
import MerchantTransactionDetailPage from '@/(owner)/transactions/MerchantTransactionDetailPage';
import TeamPage from '@/(owner)/team/TeamPage';
import RolesPage from '@/(owner)/roles/RolesPage';
import MerchantServiceQuotesPage from '@/(owner)/quotes/ServiceQuotesPage';
import MerchantServiceJobsPage from '@/(owner)/jobs/ServiceJobsPage';
import MerchantReservationsPage from '@/(owner)/bookings/ReservationsPage';
import MerchantCustomOrdersPage from '@/(owner)/custom-orders/CustomOrdersPage';

import CustomerLedgerPage from '@/(customer)/ledger/LedgerPage';
import CustomerHomePage from '@/(customer)/home/CustomerHomePage';
import CustomerOrderDetailPage from '@/(customer)/orders/CustomerOrderDetailPage';
import TransactionsPage from '@/(customer)/transactions/TransactionsPage';
import TransactionDetailPage from '@/(customer)/transactions/TransactionDetailPage';
import CustomerServiceQuotesPage from '@/(customer)/quotes/ServiceQuotesPage';
import CustomerServiceJobsPage from '@/(customer)/jobs/ServiceJobsPage';
import CustomerReservationsPage from '@/(customer)/bookings/ReservationsPage';
import CustomerCustomOrdersPage from '@/(customer)/custom-orders/CustomOrdersPage';
import SettlementPage from '@/components/payments/LiveSettlementPage';
import { SettlementNotificationsPage } from '@/components/payments/SettlementAlerts';
import { SettlementHistoryPage } from '@/components/payments/SettlementHistory';
import { ComingSoonPage } from '@/components/reference/ComingSoonPage';
import { SubscriptionPlansPage } from '@/components/reference/SubscriptionPlansPage';
import { CategoriesPage } from '@/components/reference/ReferenceMarketplacePage';
import { InventoryPage, AdminDirectoryPage } from '@/components/reference/ReferenceDirectories';
import { ModuleOverviewPage } from '@/components/reference/ModuleOverviewPage';
import { AdminPlansPage } from '@/components/reference/AdminPlansPage';
import { AdminContentPage } from '@/components/reference/AdminContentPage';
import { PublishedPage } from '@/components/reference/PublishedPage';
import { PlanProvider, PlanGate } from '@/lib/context/plan';

const MERCHANT_ROLES: AccountType[] = ['merchant', 'store_owner'];
const AdminRecordsPage=lazy(()=>import('@/components/reference/AdminRecordsPage'));
const CustomerInvoicesPage=lazy(()=>import('@/components/erp/CustomerInvoicesPage'));
const AdminPlanEditorPage=lazy(()=>import('@/components/reference/AdminPlanEditorPage'));
function AdminRecords({scope}:{scope:'customers'|'products'|'categories'|'operations'|'erp'}){return <Suspense fallback={<p className="reference-note" role="status">Opening admin records…</p>}><AdminRecordsPage scope={scope}/></Suspense>}
const ERP_VIEWS={
 purchasing:lazy(()=>import('@/components/erp/PurchasingPage')),
 stock:lazy(()=>import('@/components/erp/StockPage')),
 accounting:lazy(()=>import('@/components/erp/AccountingPage')),
 chart:lazy(()=>import('@/components/erp/ChartOfAccountsPage')),
 imports:lazy(()=>import('@/components/erp/AccountingImportsPage')),
 customers:lazy(()=>import('@/components/erp/CustomersPage')),
 people:lazy(()=>import('@/components/erp/PeoplePage')),
 reports:lazy(()=>import('@/components/erp/ReportsPage')),
 activity:lazy(()=>import('@/components/erp/ActivityPage')),
 reconciliation:lazy(()=>import('@/components/erp/ReconciliationPage')),
};
function ERPView({name}:{name:keyof typeof ERP_VIEWS}){const View=ERP_VIEWS[name];return <Suspense fallback={<p className="reference-note" role="status">Opening business workspace…</p>}><View/></Suspense>}

export default function App() {
  return (
    <Routes>
      <Route element={<PublicHubLayout />}>
        <Route path="/" element={<MarketplaceHomePage />} />
        <Route path="/categories" element={<CategoriesPage />} />
        <Route path="/pages/:slug" element={<PublishedPage />} />
        <Route path="/coming-soon/:feature" element={<div className="reference-page p-6"><ComingSoonPage /></div>} />
      </Route>

      <Route element={<PublicStorefrontLayout />}>
        <Route path="/q/:token" element={<QRLandingPage />} />
        <Route path="/checkout" element={<CheckoutRedirect />} />
        <Route path="/store/:store_slug" element={<StorefrontPage />} />
        <Route path="/store/:store_slug/checkout" element={<CheckoutPage />} />
        <Route path="/store/:store_slug/orders/:orderId" element={<OrderTrackingPage />} />
      </Route>

      <Route path="/login" element={<PortalLoginPage />} />
      <Route path="/portal/login" element={<PortalLoginPage />} />
      <Route path="/forgot-password" element={<PasswordRecoveryPage key="request" mode="request" />} />
      <Route path="/reset-password" element={<PasswordRecoveryPage key="reset" mode="reset" />} />
      <Route path="/register/merchant" element={<MerchantSelfRegisterPage />} />
      <Route path="/register/customer" element={<CustomerRegisterPage />} />

      <Route element={<CustomerAccountLayout />}>
      <Route path="/account/coming-soon/:feature" element={<ProtectedRoute roles={['customer']}><ComingSoonPage role="customer" /></ProtectedRoute>} />
      <Route path="/account" element={<ProtectedRoute roles={['customer']}><CustomerHomePage /></ProtectedRoute>} />
      <Route
        path="/account/ledger"
        element={
          <ProtectedRoute roles={['customer']}>
            <CustomerLedgerPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/account/orders/:orderId"
        element={
          <ProtectedRoute roles={['customer']}>
            <CustomerOrderDetailPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/account/quotes"
        element={<ProtectedRoute roles={['customer']}><CustomerServiceQuotesPage /></ProtectedRoute>}
      />

      <Route path="/account/jobs" element={<ProtectedRoute roles={['customer']}><CustomerServiceJobsPage /></ProtectedRoute>} />
      <Route path="/account/invoices" element={<ProtectedRoute roles={['customer']}><Suspense fallback={<p role="status">Opening invoices…</p>}><CustomerInvoicesPage/></Suspense></ProtectedRoute>}/>
      <Route path="/account/bookings" element={<ProtectedRoute roles={['customer']}><CustomerReservationsPage /></ProtectedRoute>} />
      <Route path="/account/custom-orders" element={<ProtectedRoute roles={['customer']}><CustomerCustomOrdersPage /></ProtectedRoute>} />
      <Route path="/account/settlements" element={<ProtectedRoute roles={['customer']}><SettlementPage mode="customer" /></ProtectedRoute>} />

      <Route
        path="/account/transactions"
        element={
          <ProtectedRoute roles={['customer']}>
            <TransactionsPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/account/transactions/:transactionId"
        element={
          <ProtectedRoute roles={['customer']}>
            <TransactionDetailPage />
          </ProtectedRoute>
        }
      />
      </Route>

      <Route
        path="/portal"
        element={
          <ProtectedRoute>
            <MarketplaceProvider>
              <MarketplaceBootstrap>
                <PermissionsProvider>
                  <PlanProvider><PortalDashboardLayout /></PlanProvider>
                </PermissionsProvider>
              </MarketplaceBootstrap>
            </MarketplaceProvider>
          </ProtectedRoute>
        }
      >
        <Route index element={<PortalHomePage />} />

        <Route path="admin" element={<ProtectedRoute roles={['system_admin']}><AdminDashboardPage /></ProtectedRoute>} />
        <Route path="admin/modules" element={<ProtectedRoute roles={['system_admin']}><ModuleOverviewPage role="admin" /></ProtectedRoute>} />
        <Route path="admin/modules/:moduleId" element={<ProtectedRoute roles={['system_admin']}><ModuleOverviewPage role="admin" /></ProtectedRoute>} />
        <Route path="admin/plans" element={<ProtectedRoute roles={['system_admin']}><AdminPlansPage /></ProtectedRoute>} />
        <Route path="admin/marketplace" element={<ProtectedRoute roles={['system_admin']}><AdminContentPage kind="marketplace" /></ProtectedRoute>} />
        <Route path="admin/pages" element={<ProtectedRoute roles={['system_admin']}><AdminContentPage kind="page" /></ProtectedRoute>} />
        <Route path="admin/coming-soon/:feature" element={<ProtectedRoute roles={['system_admin']}><ComingSoonPage role="admin" /></ProtectedRoute>} />
        <Route path="admin/orders" element={<ProtectedRoute roles={['system_admin']}><AdminDirectoryPage kind="orders"/></ProtectedRoute>} />
        <Route path="admin/plans/new" element={<ProtectedRoute roles={['system_admin']}><Suspense fallback={<p role="status">Opening plan editor…</p>}><AdminPlanEditorPage create/></Suspense></ProtectedRoute>}/>
        <Route path="admin/plans/:slug/edit" element={<ProtectedRoute roles={['system_admin']}><Suspense fallback={<p role="status">Opening plan editor…</p>}><AdminPlanEditorPage/></Suspense></ProtectedRoute>}/>
        {(['customers','products','categories','operations','erp'] as const).map(scope=><Route key={scope} path={`admin/${scope}`} element={<ProtectedRoute roles={['system_admin']}><AdminRecords scope={scope}/></ProtectedRoute>}/>)}
        <Route path="admin/merchants" element={<ProtectedRoute roles={['system_admin']}><AdminDirectoryPage kind="merchants"/></ProtectedRoute>} />
        <Route path="admin/settlements" element={<ProtectedRoute roles={['system_admin']}><SettlementPage mode="admin" /></ProtectedRoute>} />
        <Route path="admin/notifications" element={<ProtectedRoute roles={['system_admin']}><SettlementNotificationsPage /></ProtectedRoute>} />
        <Route path="admin/settlements/history/:kind/:id" element={<ProtectedRoute roles={['system_admin']}><SettlementHistoryPage /></ProtectedRoute>} />
        <Route path="admin/kyc" element={<ProtectedRoute roles={['system_admin']}><AdminKycPage /></ProtectedRoute>} />
        <Route path="admin/merchants/new" element={<ProtectedRoute roles={['system_admin']}><AdminMerchantOnboardPage /></ProtectedRoute>} />
        <Route path="admin/admins/new" element={<ProtectedRoute roles={['system_admin']}><PlatformAdminCreatePage /></ProtectedRoute>} />
        <Route path="admin/stores" element={<ProtectedRoute roles={['system_admin']}><AdminStoresPage /></ProtectedRoute>} />
        <Route path="admin/stores/new" element={<ProtectedRoute roles={['system_admin']}><AdminAddStorePage /></ProtectedRoute>} />

        <Route path="owner" element={<ProtectedRoute roles={MERCHANT_ROLES}><OwnerDashboardPage /></ProtectedRoute>} />
        <Route path="owner/purchasing" element={<ProtectedRoute roles={MERCHANT_ROLES} permission="products.view"><PlanGate feature="inventory"><ERPView name="purchasing"/></PlanGate></ProtectedRoute>}/>
        <Route path="owner/stock-control" element={<ProtectedRoute roles={MERCHANT_ROLES} permission="products.view"><PlanGate feature="inventory"><ERPView name="stock"/></PlanGate></ProtectedRoute>}/>
        <Route path="owner/accounting" element={<ProtectedRoute roles={MERCHANT_ROLES} permission="erp.finance"><PlanGate feature="accounting"><ERPView name="accounting"/></PlanGate></ProtectedRoute>}/>
        <Route path="owner/accounting/accounts" element={<ProtectedRoute roles={MERCHANT_ROLES} permission="erp.finance"><PlanGate feature="accounting"><ERPView name="chart"/></PlanGate></ProtectedRoute>}/>
        <Route path="owner/accounting/imports" element={<ProtectedRoute roles={MERCHANT_ROLES} permission="erp.finance"><PlanGate feature="accounting"><ERPView name="imports"/></PlanGate></ProtectedRoute>}/>
        <Route path="owner/reconciliation" element={<ProtectedRoute roles={MERCHANT_ROLES} permission="erp.finance"><PlanGate feature="accounting"><ERPView name="reconciliation"/></PlanGate></ProtectedRoute>}/>
        <Route path="owner/customers" element={<ProtectedRoute roles={MERCHANT_ROLES} permission="erp.customers"><PlanGate feature="crm"><ERPView name="customers"/></PlanGate></ProtectedRoute>}/>
        <Route path="owner/people" element={<ProtectedRoute roles={MERCHANT_ROLES} permission="erp.people"><PlanGate feature="hr"><ERPView name="people"/></PlanGate></ProtectedRoute>}/>
        <Route path="owner/reports" element={<ProtectedRoute roles={MERCHANT_ROLES} permission="erp.finance"><PlanGate feature="accounting"><ERPView name="reports"/></PlanGate></ProtectedRoute>}/>
        <Route path="owner/activity" element={<ProtectedRoute roles={MERCHANT_ROLES} permission="erp.finance"><ERPView name="activity"/></ProtectedRoute>}/>
        <Route path="owner/modules" element={<ProtectedRoute roles={MERCHANT_ROLES}><ModuleOverviewPage role="owner" /></ProtectedRoute>} />
        <Route path="owner/modules/:moduleId" element={<ProtectedRoute roles={MERCHANT_ROLES}><ModuleOverviewPage role="owner" /></ProtectedRoute>} />
        <Route path="owner/coming-soon/:feature" element={<ProtectedRoute roles={MERCHANT_ROLES}><ComingSoonPage role="owner" /></ProtectedRoute>} />
        <Route path="owner/plans" element={<ProtectedRoute roles={MERCHANT_ROLES}><SubscriptionPlansPage /></ProtectedRoute>} />
        <Route path="owner/inventory" element={<ProtectedRoute roles={MERCHANT_ROLES} anyPermission={[PERM.productsView]}><PlanGate feature="inventory"><InventoryPage /></PlanGate></ProtectedRoute>} />
        <Route path="owner/stores" element={<ProtectedRoute roles={MERCHANT_ROLES}><MerchantStoresPage /></ProtectedRoute>} />
        <Route path="owner/stores/new" element={<ProtectedRoute roles={MERCHANT_ROLES}><MerchantAddStorePage /></ProtectedRoute>} />
        <Route path="owner/store-settings" element={<ProtectedRoute roles={MERCHANT_ROLES}><MerchantStoreSettingsPage /></ProtectedRoute>} />
        <Route path="owner/products" element={<ProtectedRoute roles={MERCHANT_ROLES}><MerchantProductsPage /></ProtectedRoute>} />
        <Route path="owner/orders" element={<ProtectedRoute roles={MERCHANT_ROLES}><MerchantOrdersPage /></ProtectedRoute>} />
        <Route path="owner/quotes" element={<ProtectedRoute roles={MERCHANT_ROLES}><MerchantServiceQuotesPage /></ProtectedRoute>} />
        <Route path="owner/jobs" element={<ProtectedRoute roles={MERCHANT_ROLES}><MerchantServiceJobsPage /></ProtectedRoute>} />
        <Route path="owner/bookings" element={<ProtectedRoute roles={MERCHANT_ROLES}><MerchantReservationsPage /></ProtectedRoute>} />
        <Route path="owner/custom-orders" element={<ProtectedRoute roles={MERCHANT_ROLES}><MerchantCustomOrdersPage /></ProtectedRoute>} />
        <Route path="owner/transactions" element={<ProtectedRoute roles={MERCHANT_ROLES}><MerchantTransactionsPage /></ProtectedRoute>} />
        <Route path="owner/settlements" element={<ProtectedRoute roles={MERCHANT_ROLES} permission={PERM.transactionsView}><SettlementPage mode="merchant" /></ProtectedRoute>} />
        <Route path="owner/transactions/:transactionId" element={<ProtectedRoute roles={MERCHANT_ROLES}><MerchantTransactionDetailPage /></ProtectedRoute>} />
        <Route path="owner/counter" element={<ProtectedRoute roles={MERCHANT_ROLES}><PlanGate feature="sales"><MerchantCounterPage /></PlanGate></ProtectedRoute>} />
        <Route path="owner/menu" element={<ProtectedRoute roles={MERCHANT_ROLES}><MerchantMenuCategoriesPage /></ProtectedRoute>} />
        <Route path="owner/tables" element={<ProtectedRoute roles={MERCHANT_ROLES}><MerchantTablesPage /></ProtectedRoute>} />
        <Route path="owner/kitchen" element={<ProtectedRoute roles={MERCHANT_ROLES} anyPermission={[PERM.ordersStatusUpdate, PERM.ordersView]}><MerchantKitchenDisplayPage /></ProtectedRoute>} />
        <Route path="owner/businesses/new" element={<ProtectedRoute roles={MERCHANT_ROLES} permission={PERM.storesManage}><MerchantAddBusinessPage /></ProtectedRoute>} />
        <Route path="owner/team" element={<ProtectedRoute roles={MERCHANT_ROLES} permission={PERM.membersView}><TeamPage /></ProtectedRoute>} />
        <Route path="owner/roles" element={<ProtectedRoute roles={MERCHANT_ROLES} permission={PERM.rolesView}><RolesPage /></ProtectedRoute>} />

        {/* Legacy redirect */}
        <Route path="admin/owners" element={<Navigate to="/portal/admin/merchants/new" replace />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
