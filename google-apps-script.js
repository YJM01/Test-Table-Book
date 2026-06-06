/**
 * Google Apps Script for TableBook Reservation System
 * This script handles database operations on Google Sheets and automatic email routing using Gmail.
 * 
 * Deployment Steps:
 * 1. Create a Google Sheet, name it, and set up your columns in the first row:
 *    ID | CustomerName | Email | Phone | ReservationDate | ReservationTime | Guests | SpecialRequest | Status | CreatedAt
 * 2. Click Extensions > Apps Script in the Google Sheet menu.
 * 3. Delete any default code in Code.gs and paste this entire script.
 * 4. Click 'Deploy' > 'New deployment'.
 * 5. Select type: 'Web app'.
 * 6. Set Description: 'TableBook API'.
 * 7. Set 'Execute as': 'Me' (your email).
 * 8. Set 'Who has access': 'Anyone' (this is crucial for public access from your client website).
 * 9. Click Deploy, authorize permissions, and copy the Web App URL.
 * 10. Paste this URL into the TableBook App Settings to enable real-time cloud database sync!
 */

// Handle GET requests (retrieves all reservations for the Admin Dashboard)
function doGet(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var rows = sheet.getDataRange().getValues();
    
    // If sheet is empty or only headers exist
    if (rows.length <= 1) {
      return createJsonResponse({ status: "success", data: [] });
    }
    
    var headers = rows[0];
    var data = [];
    
    for (var i = 1; i < rows.length; i++) {
      var row = rows[i];
      var reservation = {};
      for (var j = 0; j < headers.length; j++) {
        var value = row[j];
        // Format Dates appropriately for JSON response
        if (value instanceof Date) {
          // If columns are ReservationDate or CreatedAt
          if (headers[j] === "ReservationDate") {
            // Keep date as YYYY-MM-DD
            reservation[headers[j]] = Utilities.formatDate(value, Session.getScriptTimeZone(), "yyyy-MM-dd");
          } else {
            reservation[headers[j]] = value.toISOString();
          }
        } else {
          reservation[headers[j]] = value;
        }
      }
      data.push(reservation);
    }
    
    // Sort reservations by CreatedAt descending by default
    data.sort(function(a, b) {
      return new Date(b.CreatedAt) - new Date(a.CreatedAt);
    });
    
    return createJsonResponse({ status: "success", data: data });
  } catch (error) {
    return createJsonResponse({ status: "error", message: error.toString() });
  }
}

// Handle POST requests (creation, updating status, and deletion)
function doPost(e) {
  try {
    var rawData;
    if (e.postData.type === "application/json") {
      rawData = JSON.parse(e.postData.contents);
    } else {
      rawData = e.parameter;
    }
    
    var action = rawData.action || "create";
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    
    if (action === "create") {
      return handleCreateReservation(rawData, sheet);
    } else if (action === "update") {
      return handleUpdateStatus(rawData, sheet);
    } else if (action === "delete") {
      return handleDeleteReservation(rawData, sheet);
    } else {
      return createJsonResponse({ status: "error", message: "Invalid action specified." });
    }
    
  } catch (error) {
    return createJsonResponse({ status: "error", message: error.toString() });
  }
}

// Subhandler: Create a new reservation
function handleCreateReservation(data, sheet) {
  var id = "RES-" + Math.floor(100000 + Math.random() * 900000);
  var createdAt = new Date().toISOString();
  var defaultStatus = "Pending";
  
  // Format inputs
  var name = data.customerName || "";
  var email = data.email || "";
  var phone = data.phone || "";
  var date = data.reservationDate || "";
  var time = data.reservationTime || "";
  var guests = parseInt(data.guests) || 2;
  var request = data.specialRequest || "";
  
  // Append new row
  sheet.appendRow([
    id,
    name,
    email,
    phone,
    date,
    time,
    guests,
    request,
    defaultStatus,
    createdAt
  ]);
  
  return createJsonResponse({
    status: "success",
    message: "Reservation created successfully.",
    data: {
      id: id,
      customerName: name,
      email: email,
      phone: phone,
      reservationDate: date,
      reservationTime: time,
      guests: guests,
      specialRequest: request,
      status: defaultStatus,
      createdAt: createdAt
    }
  });
}

// Subhandler: Update Reservation Status (and trigger email notification)
function handleUpdateStatus(data, sheet) {
  var resId = data.id;
  var newStatus = data.status; // "Confirmed" or "Rejected"
  
  if (!resId || !newStatus) {
    return createJsonResponse({ status: "error", message: "Missing reservation ID or new status." });
  }
  
  var rows = sheet.getDataRange().getValues();
  var headers = rows[0];
  var idColIndex = headers.indexOf("ID");
  var statusColIndex = headers.indexOf("Status");
  var nameColIndex = headers.indexOf("CustomerName");
  var emailColIndex = headers.indexOf("Email");
  var dateColIndex = headers.indexOf("ReservationDate");
  var timeColIndex = headers.indexOf("ReservationTime");
  
  if (idColIndex === -1 || statusColIndex === -1) {
    return createJsonResponse({ status: "error", message: "Incorrect Sheet schema detected." });
  }
  
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][idColIndex] === resId) {
      // Update cell in Sheets (row index is 1-based, plus header offset)
      sheet.getRange(i + 1, statusColIndex + 1).setValue(newStatus);
      
      // Get customer information to trigger emails
      var customerName = rows[i][nameColIndex];
      var customerEmail = rows[i][emailColIndex];
      var resDate = rows[i][dateColIndex];
      var resTime = rows[i][timeColIndex];
      
      // Send appropriate notification emails
      if (newStatus === "Confirmed") {
        sendConfirmationEmail(customerEmail, customerName, resDate, resTime);
      } else if (newStatus === "Rejected") {
        sendRejectionEmail(customerEmail, customerName, resDate, resTime);
      }
      
      return createJsonResponse({
        status: "success",
        message: "Status updated to " + newStatus + " and notification sent."
      });
    }
  }
  
  return createJsonResponse({ status: "error", message: "Reservation ID not found." });
}

// Subhandler: Delete reservation row
function handleDeleteReservation(data, sheet) {
  var resId = data.id;
  if (!resId) {
    return createJsonResponse({ status: "error", message: "Missing reservation ID." });
  }
  
  var rows = sheet.getDataRange().getValues();
  var headers = rows[0];
  var idColIndex = headers.indexOf("ID");
  
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][idColIndex] === resId) {
      sheet.deleteRow(i + 1); // delete 1-based row index
      return createJsonResponse({ status: "success", message: "Reservation deleted successfully." });
    }
  }
  
  return createJsonResponse({ status: "error", message: "Reservation ID not found." });
}

// Send Email: Confirmation
function sendConfirmationEmail(email, name, date, time) {
  var formattedDate = date;
  if (date instanceof Date) {
    formattedDate = Utilities.formatDate(date, Session.getScriptTimeZone(), "MMMM d, yyyy");
  }
  
  var subject = "Reservation Confirmed - TableBook";
  var htmlBody = "Hello " + name + ",<br><br>" +
                 "Your reservation has been <strong>confirmed</strong>.<br><br>" +
                 "<strong>Reservation Details:</strong><br>" +
                 "• Date: " + formattedDate + "<br>" +
                 "• Time: " + time + "<br><br>" +
                 "Thank you for choosing our restaurant.<br><br>" +
                 "Best regards,<br>" +
                 "<strong>TableBook Restaurants Team</strong>";
                 
  MailApp.sendEmail({
    to: email,
    subject: subject,
    htmlBody: htmlBody
  });
}

// Send Email: Rejection
function sendRejectionEmail(email, name, date, time) {
  var formattedDate = date;
  if (date instanceof Date) {
    formattedDate = Utilities.formatDate(date, Session.getScriptTimeZone(), "MMMM d, yyyy");
  }
  
  var subject = "Reservation Unavailable - TableBook";
  var htmlBody = "Hello " + name + ",<br><br>" +
                 "Unfortunately, your requested reservation on " + formattedDate + " at " + time + " is <strong>unavailable</strong>.<br><br>" +
                 "Please choose another date or time or contact us directly.<br><br>" +
                 "Thank you for your understanding.<br><br>" +
                 "Best regards,<br>" +
                 "<strong>TableBook Restaurants Team</strong>";
                 
  MailApp.sendEmail({
    to: email,
    subject: subject,
    htmlBody: htmlBody
  });
}

// Utility: Build response output with correct headers for Web App redirection & CORS
function createJsonResponse(jsonOutput) {
  return ContentService.createTextOutput(JSON.stringify(jsonOutput))
    .setMimeType(ContentService.MimeType.JSON);
}
