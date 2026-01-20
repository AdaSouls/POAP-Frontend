import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useDrawer } from '../drawer/drawer.provider';
import { mvpSmartContractService } from '../../../services/mvp-smart-contract.service';

const UserRolesContext = createContext();

export const UserRolesProvider = ({ children }) => {
  const { ethereum } = useDrawer();
  const [userRoles, setUserRoles] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isIssuer, setIsIssuer] = useState(false);
  const [isAttendee, setIsAttendee] = useState(false);
  const [issuerId, setIssuerId] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const initializeUserRole = useCallback(async () => {
    if (isInitialized || isLoading || !ethereum?.provider) return; // Prevent multiple initializations
    
    try {
      setIsLoading(true);
      await mvpSmartContractService.initialize(ethereum.provider);
      
      const [adminStatus, issuerInfo, userTokens] = await Promise.all([
        mvpSmartContractService.isAdmin(ethereum.provider.address),
        mvpSmartContractService.isIssuer(ethereum.provider.address),
        mvpSmartContractService.getUserTokens(ethereum.provider.address)
      ]);
      
      const roles = [];
      
      if (adminStatus) {
        roles.push('admin');
        setIsAdmin(true);
      }
      
      if (issuerInfo.isIssuer) {
        roles.push('organizer');
        setIsIssuer(true);
        setIssuerId(issuerInfo.issuerId);
      }
      
      if (userTokens.length > 0) {
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
  }, [isInitialized, isLoading, ethereum]);

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
    if (ethereum && ethereum.provider && !isInitialized && !isLoading) {
      initializeUserRole();
    } else if (!ethereum || !ethereum.provider) {
      resetRoles();
    }
  }, [ethereum, isInitialized, isLoading]);

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
