import { Routes, Route, Navigate } from 'react-router-dom';
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
import SettlementRehearsalPage, { MerchantSettlementRehearsalPage } from '@/components/payments/SettlementRehearsalPage';
import { ComingSoonPage } from '@/components/reference/ComingSoonPage';
import { SubscriptionPlansPage } from '@/components/reference/SubscriptionPlansPage';
import { CategoriesPage } from '@/components/reference/ReferenceMarketplacePage';
import { InventoryPage, AdminDirectoryPage } from '@/components/reference/ReferenceDirectories';
import { AdminPlansPage } from '@/components/reference/AdminPlansPage';
import { AdminContentPage } from '@/components/reference/AdminContentPage';
import { PublishedPage } from '@/components/reference/PublishedPage';
import { PlanProvider, PlanGate } from '@/lib/context/plan';

const MERCHANT_ROLES: AccountType[] = ['merchant', 'store_owner'];

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
      <Route path="/account/bookings" element={<ProtectedRoute roles={['customer']}><CustomerReservationsPage /></ProtectedRoute>} />
      <Route path="/account/custom-orders" element={<ProtectedRoute roles={['customer']}><CustomerCustomOrdersPage /></ProtectedRoute>} />
      <Route path="/account/settlements" element={<ProtectedRoute roles={['customer']}><SettlementRehearsalPage mode="customer" /></ProtectedRoute>} />

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
        <Route path="admin/plans" element={<ProtectedRoute roles={['system_admin']}><AdminPlansPage /></ProtectedRoute>} />
        <Route path="admin/marketplace" element={<ProtectedRoute roles={['system_admin']}><AdminContentPage kind="marketplace" /></ProtectedRoute>} />
        <Route path="admin/pages" element={<ProtectedRoute roles={['system_admin']}><AdminContentPage kind="page" /></ProtectedRoute>} />
        <Route path="admin/coming-soon/:feature" element={<ProtectedRoute roles={['system_admin']}><ComingSoonPage role="admin" /></ProtectedRoute>} />
        <Route path="admin/orders" element={<ProtectedRoute roles={['system_admin']}><AdminDirectoryPage kind="orders"/></ProtectedRoute>} />
        <Route path="admin/merchants" element={<ProtectedRoute roles={['system_admin']}><AdminDirectoryPage kind="merchants"/></ProtectedRoute>} />
        <Route path="admin/settlements" element={<ProtectedRoute roles={['system_admin']}><SettlementRehearsalPage mode="admin" /></ProtectedRoute>} />
        <Route path="admin/kyc" element={<ProtectedRoute roles={['system_admin']}><AdminKycPage /></ProtectedRoute>} />
        <Route path="admin/merchants/new" element={<ProtectedRoute roles={['system_admin']}><AdminMerchantOnboardPage /></ProtectedRoute>} />
        <Route path="admin/admins/new" element={<ProtectedRoute roles={['system_admin']}><PlatformAdminCreatePage /></ProtectedRoute>} />
        <Route path="admin/stores" element={<ProtectedRoute roles={['system_admin']}><AdminStoresPage /></ProtectedRoute>} />
        <Route path="admin/stores/new" element={<ProtectedRoute roles={['system_admin']}><AdminAddStorePage /></ProtectedRoute>} />

        <Route path="owner" element={<ProtectedRoute roles={MERCHANT_ROLES}><OwnerDashboardPage /></ProtectedRoute>} />
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
        <Route path="owner/settlements" element={<ProtectedRoute roles={MERCHANT_ROLES}><MerchantSettlementRehearsalPage /></ProtectedRoute>} />
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
