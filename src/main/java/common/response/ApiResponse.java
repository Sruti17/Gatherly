// src/main/java/com/gatherly/gatherly/common/response/ApiResponse.java
package common.response; 

import java.time.LocalDateTime;

public class ApiResponse {
    
    private String message;
    private boolean success;
    private LocalDateTime timestamp;
    private Object data; // This allows you to attach user details, event lists, etc., later

    // Constructor used for simple success/fail messages (like our Register method)
    public ApiResponse(String message, boolean success) {
        this.message = message;
        this.success = success;
        this.timestamp = LocalDateTime.now();
    }

    // Constructor used when you also need to return data to the frontend
    public ApiResponse(String message, boolean success, Object data) {
        this.message = message;
        this.success = success;
        this.data = data;
        this.timestamp = LocalDateTime.now();
    }

    // --- Getters and Setters ---
    
    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public boolean isSuccess() {
        return success;
    }

    public void setSuccess(boolean success) {
        this.success = success;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }

    public Object getData() {
        return data;
    }

    public void setData(Object data) {
        this.data = data;
    }
}