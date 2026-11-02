package com.shopora.orders.exception;

/** catalog-service est injoignable : on ne peut pas valider les prix et le stock. */
public class CatalogUnavailableException extends RuntimeException {

    public CatalogUnavailableException(String message, Throwable cause) {
        super(message, cause);
    }
}
