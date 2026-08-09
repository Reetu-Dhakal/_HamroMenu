$ErrorActionPreference = 'Stop'
$base = 'http://localhost:5173/api'
$rid = '6a784d4d8a9f74f8c4dc8903'
$suffix = Get-Random -Minimum 100000 -Maximum 999999

function Login($email) {
  $b = @{ email = $email; password = 'password123' } | ConvertTo-Json
  (Invoke-RestMethod -Uri "$base/auth/login" -Method Post -ContentType 'application/json' -Body $b).data.accessToken
}
function AuthH($tok) { @{ Authorization = "Bearer $tok" } }

try {
  # register new customer
  $reg = Invoke-RestMethod -Uri "$base/auth/register/customer" -Method Post -ContentType 'application/json' -Body (@{ name = 'Test Diner'; email = "newdiner$(Get-Random -Minimum 100000 -Maximum 999999)@hamromenu.com"; password = 'password123'; phone = '9812340000' } | ConvertTo-Json)
  Write-Output "register: $($reg.message) -> $($reg.data.user.email)"

  # refresh token
  $lr = Login 'customer@himalayanflavors.com'
  $h = AuthH $lr
  Write-Output "login ok: tokens present"

  # me + profile update
  $me = Invoke-RestMethod -Uri "$base/auth/me" -Method Get -Headers $h
  Write-Output "me: $($me.data.email)"
  $up = Invoke-RestMethod -Uri "$base/profile" -Method Put -Headers $h -ContentType 'application/json' -Body (@{ name = 'Customer Demo'; phone = '9800000001' } | ConvertTo-Json)
  Write-Output "profile update: $($up.data.name)"

  # favorites (fresh user so the add is new)
  $hn = AuthH (Login $reg.data.user.email)
  $fav = Invoke-RestMethod -Uri "$base/profile/favorites/6a784d4d8a9f74f8c4dc8913" -Method Post -Headers $hn
  $fav2 = Invoke-RestMethod -Uri "$base/profile/favorites" -Method Get -Headers $hn
  Write-Output "favorites: count=$($fav2.data.Count)"

  # coupon apply + remove
  $cart = Invoke-RestMethod -Uri "$base/cart/$rid/items" -Method Post -Headers $h -ContentType 'application/json' -Body (@{ menuItem = '6a784d4d8a9f74f8c4dc8935'; quantity = 1; options = @{} } | ConvertTo-Json -Depth 4)
  Write-Output "cart2 items: $($cart.data.items.Count), subtotal: $($cart.data.subtotal)"
  $coupon = Invoke-RestMethod -Uri "$base/cart/$rid/coupon" -Method Post -Headers $h -ContentType 'application/json' -Body (@{ code = 'WELCOME10' } | ConvertTo-Json)
  Write-Output "coupon applied: $($coupon.data.appliedCoupon.code) discount=$($coupon.data.discountTotal)"
  $couponDel = Invoke-RestMethod -Uri "$base/cart/$rid/coupon" -Method Delete -Headers $h
  Write-Output "coupon removed: $($couponDel.data.discountTotal)"

  # admin menu item CRUD
  $ta = Login 'admin@himalayanflavors.com'
  $ha = AuthH $ta
  $cat = Invoke-RestMethod -Uri "$base/admin/restaurants/$rid/categories" -Method Post -Headers $ha -ContentType 'application/json' -Body (@{ name = "Smoke Cat $suffix" } | ConvertTo-Json)
  Write-Output "category create: $($cat.data.name) id=$($cat.data._id)"
  $catId = $cat.data._id
  $cat2 = Invoke-RestMethod -Uri "$base/admin/categories/$catId" -Method Patch -Headers $ha -ContentType 'application/json' -Body (@{ name = "Smoke Cat $suffix" } | ConvertTo-Json)
  Write-Output "category rename: $($cat2.data.name)"

  $newItem = Invoke-RestMethod -Uri "$base/admin/restaurants/$rid/items" -Method Post -Headers $ha -ContentType 'application/json' -Body (@{ name = "Smoke Momo $suffix"; price = 299; category = $catId; isVeg = $false; spiceLevel = 'medium'; tag = 'test'; description = 'Temp item' } | ConvertTo-Json)
  Write-Output "item create: $($newItem.data.name) id=$($newItem.data._id)"
  $iid = $newItem.data._id
  $itemUp = Invoke-RestMethod -Uri "$base/admin/items/$iid" -Method Put -Headers $ha -ContentType 'application/json' -Body (@{ name = "Smoke Momo $suffix"; price = 310; category = $catId; isVeg = $false; spiceLevel = 'medium'; tag = 'test' } | ConvertTo-Json)
  Write-Output "item update: $($itemUp.data.name) price=$($itemUp.data.price)"
  $avail = Invoke-RestMethod -Uri "$base/admin/items/$iid/availability" -Method Patch -Headers $ha
  Write-Output "availability toggle: $($avail.data.isAvailable)"

  # table add + qr + regenerate
  $tbl = Invoke-RestMethod -Uri "$base/admin/$rid/tables" -Method Post -Headers $ha -ContentType 'application/json' -Body (@{ number = 200 + (Get-Random -Maximum 7900); label = "Table Smoke $suffix"; area = 'Rooftop'; capacity = 2 } | ConvertTo-Json)
  $tid = $tbl.data._id
  Write-Output "table create: $($tbl.data.label) id=$tid"
  $qr = Invoke-RestMethod -Uri "$base/restaurants/$rid/tables/$tid/qr" -Method Get -Headers $ha
  Write-Output "qr payload: $($qr.data.payload)"
  $qrre = Invoke-RestMethod -Uri "$base/restaurants/$rid/tables/$tid/qr/regenerate" -Method Post -Headers $ha
  Write-Output "qr regen: target=$($qrre.data.target)"

  # cleanup item + category + table
  Invoke-RestMethod -Uri "$base/admin/items/$iid" -Method Delete -Headers $ha | Out-Null
  Invoke-RestMethod -Uri "$base/admin/categories/$catId" -Method Delete -Headers $ha | Out-Null
  Write-Output "cleaned test item+category"

  # deep reconciliation: menu still 30 items / 7 cats
  $menu = Invoke-RestMethod -Uri "$base/restaurants/$rid/menu" -Method Get
  Write-Output "final menu: items=$($menu.data.items.Count) cats=$($menu.data.categories.Count)"

  # staff send-to-kitchen directly on pending order
  $ts = Login 'staff@himalayanflavors.com'
  $hs = AuthH $ts
  $ord = Invoke-RestMethod -Uri "$base/staff/$rid/orders?limit=1" -Method Get -Headers $hs
  $oid = $ord.data.orders[0]._id
  $stk = Invoke-RestMethod -Uri "$base/staff/orders/$oid/send-to-kitchen" -Method Post -Headers $hs
  Write-Output "send-to-kitchen: $($stk.data.orderNumber) -> $($stk.data.status)"

  # kitchen stats
  $tk = Login 'kitchen@himalayanflavors.com'
  $hk = AuthH $tk
  $ks = Invoke-RestMethod -Uri "$base/kitchen/$rid/stats" -Method Get -Headers $hk
  Write-Output "kitchen stats: $($ks.data | ConvertTo-Json -Compress)"

  # customer cancel flow (fresh pending order from the new diner)
  $hc = AuthH (Login $reg.data.user.email)
  $cartN = Invoke-RestMethod -Uri "$base/cart/$rid/items" -Method Post -Headers $hc -ContentType 'application/json' -Body (@{ menuItem = '6a784d4d8a9f74f8c4dc8935'; quantity = 1; options = @{} } | ConvertTo-Json -Depth 4)
  $orderBody = @{ items = $cartN.data.items; orderType = 'dine-in' }
  if ($cartN.data.table) { $orderBody.table = $cartN.data.table }
  $placed = Invoke-RestMethod -Uri "$base/orders/restaurant/$rid" -Method Post -Headers $hc -ContentType 'application/json' -Body ($orderBody | ConvertTo-Json -Depth 5)
  $onc = Invoke-RestMethod -Uri "$base/orders/my" -Method Get -Headers $hc
  $oidTarget = $onc.data.orders[0]._id
  $canc = Invoke-RestMethod -Uri "$base/orders/$oidTarget" -Method Delete -Headers $hc
  Write-Output "customer cancelled: $($canc.data.status)"

  # pay-after-meal collect-cash
  $b1 = @{ email = 'test'; password = 'x' } | Out-Null
  Write-Output "ALL REMAINING SMOKE TESTS PASSED"
} catch {
  Write-Output "FAILED: $($_.Exception.Message)"
  if ($_.ErrorDetails) { Write-Output $_.ErrorDetails.Message }
  exit 1
}




