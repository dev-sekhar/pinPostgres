import React from 'react';
import styles from './Card.module.css';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ 
  children, 
  className = '',
  ...props
}) => {
  return <div className={`glass-panel ${styles.card} ${className}`} {...props}>{children}</div>;
};

export const CardHeader: React.FC<CardProps> = ({ 
  children, 
  className = '',
  ...props
}) => {
  return <div className={`${styles.header} ${className}`} {...props}>{children}</div>;
};

export const CardBody: React.FC<CardProps> = ({ 
  children, 
  className = '',
  ...props
}) => {
  return <div className={`${styles.body} ${className}`} {...props}>{children}</div>;
};
