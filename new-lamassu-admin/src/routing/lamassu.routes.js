import React from 'react'
import { Redirect } from 'react-router-dom'

import Analytics from 'src/pages/Analytics/Analytics'
import Blacklist from 'src/pages/Blacklist'
import Cashout from 'src/pages/Cashout'
import Commissions from 'src/pages/Commissions'
import { Customers, CustomerProfile } from 'src/pages/Customers'
import Funding from 'src/pages/Funding'
import Locales from 'src/pages/Locales'
import IndividualDiscounts from 'src/pages/LoyaltyPanel/IndividualDiscounts'
import PromoCodes from 'src/pages/LoyaltyPanel/PromoCodes'
import MachineLogs from 'src/pages/MachineLogs'
import CashCassettes from 'src/pages/Maintenance/CashCassettes'
import MachineStatus from 'src/pages/Maintenance/MachineStatus'
import Notifications from 'src/pages/Notifications/Notifications'
import CoinAtmRadar from 'src/pages/OperatorInfo/CoinATMRadar'
import ContactInfo from 'src/pages/OperatorInfo/ContactInfo'
import MachineScreens from 'src/pages/OperatorInfo/MachineScreens'
import ReceiptPrinting from 'src/pages/OperatorInfo/ReceiptPrinting'
import SMSNotices from 'src/pages/OperatorInfo/SMSNotices/SMSNotices'
import TermsConditions from 'src/pages/OperatorInfo/TermsConditions'
import ServerLogs from 'src/pages/ServerLogs'
import Services from 'src/pages/Services/Services'
import SessionManagement from 'src/pages/SessionManagement/SessionManagement'
import TestingAddresses from 'src/pages/TestingAddresses'
import Transactions from 'src/pages/Transactions/Transactions'
import Triggers from 'src/pages/Triggers'
import UserManagement from 'src/pages/UserManagement/UserManagement'
import WalletSettings from 'src/pages/Wallet/Wallet'
import { namespaces } from 'src/utils/config'

import { ROLES } from './utils'

const getLamassuRoutes = () => [
  {
    key: 'transactions',
    label: 'Transactions',
    route: '/transactions',
    allowedRoles: [ROLES.USER, ROLES.SUPERUSER],
    component: Transactions
  },
  {
    key: 'maintenance',
    label: 'Maintenance',
    route: '/maintenance',
    allowedRoles: [ROLES.USER, ROLES.SUPERUSER],
    get component() {
      return () => <Redirect to={this.children[0].route} />
    },
    children: [
      {
        key: 'cash_cassettes',
        label: 'Cash Cassettes',
        route: '/maintenance/cash-cassettes',
        allowedRoles: [ROLES.USER, ROLES.SUPERUSER],
        component: CashCassettes
      },
      {
        key: 'funding',
        label: 'Funding',
        route: '/maintenance/funding',
        allowedRoles: [ROLES.USER, ROLES.SUPERUSER],
        component: Funding
      },
      {
        key: 'logs',
        label: 'Machine Logs',
        route: '/maintenance/logs',
        allowedRoles: [ROLES.USER, ROLES.SUPERUSER],
        component: MachineLogs
      },
      {
        key: 'machine-status',
        label: 'Machine Status',
        route: '/maintenance/machine-status',
        allowedRoles: [ROLES.USER, ROLES.SUPERUSER],
        component: MachineStatus
      },
      {
        key: 'server-logs',
        label: 'Server',
        route: '/maintenance/server-logs',
        allowedRoles: [ROLES.USER, ROLES.SUPERUSER],
        component: ServerLogs
      }
    ]
  },
  {
    key: 'analytics',
    label: 'Analytics',
    route: '/analytics',
    allowedRoles: [ROLES.USER, ROLES.SUPERUSER],
    component: Analytics
  },
  {
    key: 'settings',
    label: 'Settings',
    route: '/settings',
    allowedRoles: [ROLES.USER, ROLES.SUPERUSER],
    get component() {
      return () => <Redirect to={this.children[0].route} />
    },
    children: [
      {
        key: namespaces.COMMISSIONS,
        label: 'Commissions',
        route: '/settings/commissions',
        allowedRoles: [ROLES.USER, ROLES.SUPERUSER],
        component: Commissions
      },
      {
        key: namespaces.LOCALE,
        label: 'Locales',
        route: '/settings/locale',
        allowedRoles: [ROLES.USER, ROLES.SUPERUSER],
        component: Locales
      },
      {
        key: namespaces.CASH_OUT,
        label: 'Cash-out',
        route: '/settings/cash-out',
        allowedRoles: [ROLES.USER, ROLES.SUPERUSER],
        component: Cashout
      },
      {
        key: namespaces.NOTIFICATIONS,
        label: 'Notifications',
        route: '/settings/notifications',
        allowedRoles: [ROLES.USER, ROLES.SUPERUSER],
        component: Notifications
      },
      {
        key: 'services',
        label: '3rd Party Services',
        route: '/settings/3rd-party-services',
        allowedRoles: [ROLES.USER, ROLES.SUPERUSER],
        component: Services
      },
      {
        key: namespaces.WALLETS,
        label: 'Wallet',
        route: '/settings/wallet-settings',
        allowedRoles: [ROLES.USER, ROLES.SUPERUSER],
        component: WalletSettings
      },
      {
        key: namespaces.OPERATOR_INFO,
        label: 'Operator Info',
        route: '/settings/operator-info',
        title: 'Operator Information',
        allowedRoles: [ROLES.USER, ROLES.SUPERUSER],
        get component() {
          return () => (
            <Redirect
              to={{
                pathname: this.children[0].route,
                state: { prev: this.state?.prev }
              }}
            />
          )
        },
        children: [
          {
            key: 'contact-info',
            label: 'Contact information',
            route: '/settings/operator-info/contact-info',
            allowedRoles: [ROLES.USER, ROLES.SUPERUSER],
            component: ContactInfo
          },
          {
            key: 'receipt-printing',
            label: 'Receipt',
            route: '/settings/operator-info/receipt-printing',
            allowedRoles: [ROLES.USER, ROLES.SUPERUSER],
            component: ReceiptPrinting
          },
          {
            key: 'sms-notices',
            label: 'SMS notices',
            route: '/settings/operator-info/sms-notices',
            allowedRoles: [ROLES.USER, ROLES.SUPERUSER],
            component: SMSNotices
          },
          {
            key: 'coin-atm-radar',
            label: 'Coin ATM Radar',
            route: '/settings/operator-info/coin-atm-radar',
            allowedRoles: [ROLES.USER, ROLES.SUPERUSER],
            component: CoinAtmRadar
          },
          {
            key: 'terms-conditions',
            label: 'Terms & Conditions',
            route: '/settings/operator-info/terms-conditions',
            allowedRoles: [ROLES.USER, ROLES.SUPERUSER],
            component: TermsConditions
          },
          {
            key: 'machine-screens',
            label: 'Machine screens',
            route: '/settings/operator-info/machine-screens',
            allowedRoles: [ROLES.USER, ROLES.SUPERUSER],
            component: MachineScreens
          }
        ]
      }
    ]
  },
  {
    key: 'compliance',
    label: 'Compliance',
    route: '/compliance',
    allowedRoles: [ROLES.USER, ROLES.SUPERUSER],
    get component() {
      return () => <Redirect to={this.children[0].route} />
    },
    children: [
      {
        key: 'triggers',
        label: 'Triggers',
        route: '/compliance/triggers',
        allowedRoles: [ROLES.USER, ROLES.SUPERUSER],
        component: Triggers
      },
      {
        key: 'customers',
        label: 'Customers',
        route: '/compliance/customers',
        allowedRoles: [ROLES.USER, ROLES.SUPERUSER],
        component: Customers
      },
      {
        key: 'blacklist',
        label: 'Blacklist',
        route: '/compliance/blacklist',
        allowedRoles: [ROLES.USER, ROLES.SUPERUSER],
        component: Blacklist
      },
      {
        key: 'testing-addresses',
        label: 'Testing addresses',
        route: '/compliance/testing',
        allowedRoles: [ROLES.USER, ROLES.SUPERUSER],
        component: TestingAddresses
      },
      {
        key: 'loyalty',
        label: 'Loyalty',
        route: '/compliance/loyalty',
        title: 'Loyalty Panel',
        allowedRoles: [ROLES.USER, ROLES.SUPERUSER],
        get component() {
          return () => (
            <Redirect
              to={{
                pathname: this.children[0].route,
                state: { prev: this.state?.prev }
              }}
            />
          )
        },
        children: [
          {
            key: 'individual-discounts',
            label: 'Individual Discounts',
            route: '/compliance/loyalty/individual-discounts',
            allowedRoles: [ROLES.USER, ROLES.SUPERUSER],
            component: IndividualDiscounts
          },
          {
            key: 'promo-codes',
            label: 'Promo Codes',
            route: '/compliance/loyalty/codes',
            allowedRoles: [ROLES.USER, ROLES.SUPERUSER],
            component: PromoCodes
          }
        ]
      },
      {
        key: 'customer',
        route: '/compliance/customer/:id',
        allowedRoles: [ROLES.USER, ROLES.SUPERUSER],
        component: CustomerProfile
      }
    ]
  },
  {
    key: 'system',
    label: 'System',
    route: '/system',
    allowedRoles: [ROLES.SUPERUSER],
    get component() {
      return () => <Redirect to={this.children[0].route} />
    },
    children: [
      {
        key: 'user-management',
        label: 'User Management',
        route: '/system/user-management',
        allowedRoles: [ROLES.SUPERUSER],
        component: UserManagement
      },
      {
        key: 'session-management',
        label: 'Session Management',
        route: '/system/session-management',
        allowedRoles: [ROLES.SUPERUSER],
        component: SessionManagement
      }
    ]
  }
]

export default getLamassuRoutes
