const SUPABASE_URL = "https://fttxcbiansawocwxdfhk.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ0dHhjYmlhbnNhd29jd3hkZmhrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5MDExNDIsImV4cCI6MjA4NjQ3NzE0Mn0.QH-qpHb6n3cSzGT7cefN13QRJmep5wHMpi11WUUn8j8";

const client = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

console.log("Supabase Connected");
var products = JSON.parse(localStorage.getItem("products") || "[]");
var bills = JSON.parse(localStorage.getItem("bills") || "[]");
var bill = [];
var billCounter = parseInt(localStorage.getItem("billCounter") || "1");

function getEl(id) {
    return document.getElementById(id);
}

function saveData() {
    localStorage.setItem("products", JSON.stringify(products));
    localStorage.setItem("bills", JSON.stringify(bills));
    localStorage.setItem("billCounter", billCounter);
}

/* ===== DELETE PRODUCT ===== */

function deleteProduct(index) {
    if (!confirm("Delete product?")) return;
    products.splice(index, 1);
    saveData();
    refreshUI();
}

/* ===== EDIT PRODUCT ===== */

function editProduct(index) {

    var p = products[index];
    if (!p) return;

    var newPrice = prompt("Enter New Price:", p.price);
    if (newPrice === null) return;

    var newStock = prompt("Enter New Stock:", p.stock);
    if (newStock === null) return;

    var newGST = prompt("Enter GST %:", p.gst || 0);
    if (newGST === null) return;

    newPrice = parseFloat(newPrice);
    newStock = parseInt(newStock);
    newGST = parseFloat(newGST);

    if (isNaN(newPrice) || isNaN(newStock) || isNaN(newGST)) {
        alert("Invalid values");
        return;
    }

    p.price = newPrice;
    p.stock = newStock;
    p.gst = newGST;

    saveData();
    refreshUI();
}

/* ===== UI REFRESH ===== */

function refreshUI() {

    var inventory = getEl("inventory");
    var history = getEl("history");
    var dataList = getEl("productsList");

    if (inventory) inventory.innerHTML = "";
    if (history) history.innerHTML = "";
    if (dataList) dataList.innerHTML = "";

    if (inventory) {
        inventory.innerHTML +=
            "<div class='inv-header'>" +
                "<div>Name</div>" +
                "<div>Stock</div>" +
                "<div>Price</div>" +
                "<div>GST</div>" +
                "<div>Action</div>" +
            "</div>";
    }

    for (var i = 0; i < products.length; i++) {

        var p = products[i];
        if (!p.gst) p.gst = 0;

        if (inventory) {
            inventory.innerHTML +=
                "<div class='inventory-item'>" +
                    "<div>" + p.name + "</div>" +
                    "<div>" + p.stock + "</div>" +
                    "<div>Rs." + p.price + "</div>" +
                    "<div>" + p.gst + "%</div>" +
                    "<div>" +
                        "<button onclick='editProduct(" + i + ")'>Edit</button> " +
                        "<button onclick='deleteProduct(" + i + ")'>X</button>" +
                    "</div>" +
                "</div>";
        }

        if (dataList) {
            dataList.innerHTML +=
                "<option value='" + p.name + "'>" +
                p.name + " - Rs." + p.price +
                "</option>";
        }
    }

    for (var j = bills.length - 1; j >= 0; j--) {

        var b = bills[j];

        if (history) {
            history.innerHTML +=
                "<div class='item'>" +
                    "<span>Bill #" + b.billNo + " - " + b.customer + "</span>" +
                "</div>";
        }
    }
}

/* ===== ADD PRODUCT ===== */

function addProduct() {

    var name = getEl("pname").value.trim();
    var category = getEl("pcategory").value.trim();
    var size = getEl("psize").value.trim();
    var price = parseFloat(getEl("pprice").value);
    var stock = parseInt(getEl("pstock").value);
    var gst = parseFloat(getEl("pgst").value);

    if (!name || !category || !size || isNaN(price) || isNaN(stock)) {
        alert("Fill all fields");
        return;
    }

    if (isNaN(gst)) gst = 0;

    products.push({
        name: name,
        category: category,
        size: size,
        price: price,
        stock: stock,
        gst: gst
    });

    saveData();
    refreshUI();

    getEl("pname").value = "";
    getEl("pcategory").value = "";
    getEl("psize").value = "";
    getEl("pprice").value = "";
    getEl("pstock").value = "";
    getEl("pgst").value = "";
}

/* ===== ADD TO BILL ===== */

function addToBill() {

    var name = getEl("productSearch").value;
    var qty = parseInt(getEl("qty").value);

    var p = products.find(function(item) {
        return item.name === name;
    });

    if (!p || isNaN(qty) || qty <= 0) {
        alert("Invalid product / qty");
        return;
    }

    if (qty > p.stock) {
        alert("Not enough stock");
        return;
    }

    p.stock -= qty;

    bill.push({
        name: p.name,
        qty: qty,
        price: p.price,
        gst: p.gst || 0
    });

    saveData();
    showBill();
    refreshUI();
}

/* ===== SHOW BILL ===== */

function showBill() {

    var div = getEl("billItems");
    var totalBox = getEl("totalBox");

    if (!div || !totalBox) return;

    var now = new Date();

    div.innerHTML =
        "<div class='bill-meta'>" +
        "<b>Bill No:</b> " + billCounter + "<br>" +
        "<b>Date:</b> " + now.toLocaleString() +
        "</div><hr>";

    var subtotal = 0;
    var totalGST = 0;

    for (var i = 0; i < bill.length; i++) {

        var item = bill[i];

        var line = item.qty * item.price;
        var gstAmt = line * (item.gst / 100);

        subtotal += line;
        totalGST += gstAmt;

        div.innerHTML +=
            "<div class='item'>" +
            "<span>" + item.name +
            " x " + item.qty +
            " | GST " + item.gst + "%</span>" +
            "<span>Rs." + (line + gstAmt).toFixed(2) + "</span>" +
            "</div>";
    }

    var grand = subtotal + totalGST;

    totalBox.innerText =
        "Subtotal Rs." + subtotal.toFixed(2) +
        " | GST Rs." + totalGST.toFixed(2) +
        " | Total Rs." + grand.toFixed(2);
}

/* ===== PRINT BILL ===== */

function printBill() {

    if (bill.length === 0) {
        alert("No bill items");
        return;
    }

    var cname = getEl("cname").value;
    var phone = getEl("cphone").value;
    var now = new Date();

    var subtotal = 0;
    var totalGST = 0;

    var html = "<h2>7WinEnterprises</h2>";
    html += "<p>Bill No: " + billCounter + "</p>";
    html += "<p>Date: " + now.toLocaleString() + "</p>";
    html += "<hr>";
    html += "<p>Customer: " + cname + "</p>";
    html += "<p>Mobile: " + phone + "</p><hr>";

    for (var i = 0; i < bill.length; i++) {

        var item = bill[i];

        var line = item.qty * item.price;
        var gstAmt = line * (item.gst / 100);

        subtotal += line;
        totalGST += gstAmt;

        html += "<p>" + item.name + " x " + item.qty +
                " | GST " + item.gst + "% = Rs." +
                (line + gstAmt).toFixed(2) + "</p>";
    }

    var grand = subtotal + totalGST;

    html += "<hr>";
    html += "<p>Subtotal: Rs." + subtotal.toFixed(2) + "</p>";
    html += "<p>GST: Rs." + totalGST.toFixed(2) + "</p>";
    html += "<h3>Total: Rs." + grand.toFixed(2) + "</h3>";

    var win = window.open("", "_blank");
    win.document.write(html);
    win.document.close();
    win.print();
}

/* ===== SAVE BILL ===== */

function saveBill() {

    var cname = getEl("cname").value.trim();
    if (!cname || bill.length === 0) {
        alert("Missing data");
        return;
    }

    bills.push({
        billNo: billCounter,
        customer: cname,
        items: bill,
        date: new Date().toLocaleString()
    });

    billCounter++;
    bill = [];

    saveData();
    showBill();
    refreshUI();
}

/* ===== INIT ===== */

refreshUI();
showBill();
