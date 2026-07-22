import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useDrawer } from '../drawer/drawer.provider';

export const UserRolesContext = createContext();

function hexToBytes(hex) {
  return Uint8Array.from(Buffer.from(hex, 'hex'));
}

function bytesEqual(a, b) {
  if (a.length !== b.length) return false;
  return a.every((byte, i) => byte === b[i]);
}

export const UserRolesProvider = ({ children }) => {
  const { midnight } = useDrawer();
  const [userRoles, setUserRoles] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isIssuer, setIsIssuer] = useState(false);
  const [isAttendee, setIsAttendee] = useState(false);
  const [issuerId, setIssuerId] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Roles are derived from public ledger state (adminPk, issuers map) plus this browser's private
  // token state (one token record per issuer) — there is no self-service "become an organizer"
  // flow on Midnight; issuers are admin-registered via registerIssuer().
  const initializeUserRole = useCallback(async () => {
    if (isInitialized || isLoading || !midnight?.provider) return; // Prevent multiple initializations

    try {
      setIsLoading(true);
      const { service, address } = midnight.provider;
      const callerPk = hexToBytes(address);
      const { ledger, privateState } = await service.getState();

      const roles = [];

      const isCallerAdmin = bytesEqual(ledger.adminPk, callerPk);
      if (isCallerAdmin) {
        roles.push('admin');
        setIsAdmin(true);
      }

      if (ledger.issuers.member(callerPk)) {
        const issuer = ledger.issuers.lookup(callerPk);
        if (issuer.isActive) {
          roles.push('organizer');
          setIsIssuer(true);
          setIssuerId(address);
        }
      }

      const hasTokens = Object.keys(privateState?.tokens ?? {}).length > 0;
      if (hasTokens) {
        roles.push('attendee');
        setIsAttendee(true);
      }

      // If no specific roles, default to attendee
      if (roles.length === 0) {
        roles.push('attendee');
        setIsAttendee(true);
      }

      setUserRoles(roles);
      setIsInitialized(true);
    } catch (error) {
      console.error("Failed to initialize user role:", error);
      // Set default attendee role on error
      setUserRoles(['attendee']);
      setIsAttendee(true);
      setIsInitialized(true);
    } finally {
      setIsLoading(false);
    }
  }, [isInitialized, isLoading, midnight]);

  const resetRoles = () => {
    setUserRoles([]);
    setIsAdmin(false);
    setIsIssuer(false);
    setIsAttendee(false);
    setIssuerId(null);
    setIsInitialized(false);
    setIsLoading(false);
  };

  useEffect(() => {
    if (midnight && midnight.provider && !isInitialized && !isLoading) {
      initializeUserRole();
    } else if (!midnight || !midnight.provider) {
      resetRoles();
    }
  }, [midnight, isInitialized, isLoading, initializeUserRole]);

  return (
    <UserRolesContext.Provider value={{
      userRoles,
      isAdmin,
      isIssuer,
      isAttendee,
      issuerId,
      isInitialized,
      isLoading,
      initializeUserRole,
      resetRoles
    }}>
      {children}
    </UserRolesContext.Provider>
  );
};

export const useUserRoles = () => {
  const context = useContext(UserRolesContext);
  if (!context) {
    throw new Error('useUserRoles must be used within a UserRolesProvider');
  }
  return context;
};
