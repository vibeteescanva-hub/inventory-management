/* ===== SUPABASE CONFIG ===== */

const SUPABASE_URL = "https://fttxcbiansawocwxdfhk.supabase.co/";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ0dHhjYmlhbnNhd29jd3hkZmhrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5MDExNDIsImV4cCI6MjA4NjQ3NzE0Mn0.QH-qpHb6n3cSzGT7cefN13QRJmep5wHMpi11WUUn8j8";

const client = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

console.log("Supabase Ready");

/* ===== GLOBAL DATA ===== */

var products = [];
var bill = [];
var billCounter = 1;

/* ===== DOM HELPER ===== */

function getEl(id) {
    return document.getElementById(id);
}

/* ===== LOAD PRODUCTS FROM DATABASE ===== */

async function loadProductsFromDB() {
    
    const { data, error } = await client
        .from("product")
        .select("*")
        .order("id", { ascending: true });

    if (error) {
        console.log("Load Error:", error);
        return;
    }

    products = data || [];

    refreshUI();
}

loadProductsFromDB();

/* ===== ADD PRODUCT ===== */

async function addProduct() {

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

    const { error } = await client
        .from("product")
        .insert([{
            name: name,
            category: category,
            size: size,
            price: price,
            stock: stock,
            gst: gst
        }]);

    if (error) {
        console.log(error);
        alert("Insert Failed");
        return;
    }

    loadProductsFromDB();

    getEl("pname").value = "";
    getEl("pcategory").value = "";
    getEl("psize").value = "";
    getEl("pprice").value = "";
    getEl("pstock").value = "";
    getEl("pgst").value = "";
}

/* ===== DELETE PRODUCT ===== */

async function deleteProduct(id) {

    if (!confirm("Delete product?")) return;

    const { error } = await client
        .from("product")
        .delete()
        .eq("id", id);

    if (error) {
        console.log(error);
        alert("Delete Failed");
        return;
    }

    loadProductsFromDB();
}

/* ===== SEARCH INVENTORY ===== */

function searchInventory() {

    var searchBox = getEl("searchBox");
    if (!searchBox) return;

    var text = searchBox.value.toLowerCase();
    var items = document.getElementsByClassName("inventory-item");

    for (var i = 0; i < items.length; i++) {

        var name = items[i].getAttribute("data-name");

        if (name.indexOf(text) !== -1)
            items[i].style.display = "grid";
        else
            items[i].style.display = "none";
    }
}

/* ===== REFRESH UI ===== */

function refreshUI() {

    var inventory = getEl("inventory");
    var dataList = getEl("productsList");

    if (inventory) inventory.innerHTML = "";
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
                "<div class='inventory-item' data-name='" + p.name.toLowerCase() + "'>" +
                    "<div>" + p.name + "</div>" +
                    "<div>" + p.stock + "</div>" +
                    "<div>Rs." + p.price + "</div>" +
                    "<div>" + p.gst + "%</div>" +
                    "<div>" +
                        "<button onclick='deleteProduct(" + p.id + ")'>X</button>" +
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
}

/* ===== ADD TO BILL ===== */

async function addToBill() {

    var name = getEl("productSearch").value;
    var qty = parseInt(getEl("qty").value);

    var p = products.find(x => x.name === name);

    if (!p || isNaN(qty) || qty <= 0) {
        alert("Invalid product / qty");
        return;
    }

    if (qty > p.stock) {
        alert("Not enough stock");
        return;
    }

    const newStock = p.stock - qty;

    const { error } = await client
        .from("product")
        .update({ stock: newStock })
        .eq("id", p.id);

    if (error) {
        console.log(error);
        alert("Stock Update Failed");
        return;
    }

    bill.push({
        name: p.name,
        qty: qty,
        price: p.price,
        gst: p.gst || 0
    });

    loadProductsFromDB();
    showBill();
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

/* ===== SAVE BILL (UI RESET ONLY) ===== */

function saveBill() {
    billCounter++;
    bill = [];
    showBill();
}
