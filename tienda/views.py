from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from .models import Producto, Carrito, ItemCarrito, Perfil
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.db import IntegrityError

def registro_view(request):
    if request.method == 'POST':
        username = request.POST.get('username')
        email = request.POST.get('email')
        first_name = request.POST.get('first_name')
        last_name = request.POST.get('last_name')
        password1 = request.POST.get('password1')
        password2 = request.POST.get('password2')
        telefono = request.POST.get('telefono')
        
        
        try:
            user = User.objects.create_user(
                username=username,
                email=email,
                password=password1,
                first_name=first_name,
                last_name=last_name
            )
            
            Perfil.objects.create(
                usuario=user,
                telefono=telefono
            )
    
            login(request, user)
            messages.success(request, '¡Cuenta creada exitosamente!')
            return redirect('inicio')
            
        except IntegrityError:
            messages.error(request, 'Error al crear la cuenta')
            return render(request, 'registro.html')
    
    return render(request, 'registro.html')

def login_view(request):
    if request.method == 'POST':
        username = request.POST.get('username')
        password = request.POST.get('password')
        
        user = authenticate(request, username=username, password=password)
        
        if user is not None:
            login(request, user)
            messages.success(request, '¡Bienvenido de nuevo!')
            return redirect('inicio')
        else:
            messages.error(request, 'Usuario o contraseña incorrectos')
    
    return render(request, 'login.html')

def logout_view(request):
    logout(request)
    messages.success(request, 'Has cerrado sesión correctamente')
    return redirect('login')

    if request.method == 'POST':
        item = get_object_or_404(ItemCarrito, id=item_id, carrito__usuario=request.user)
        cantidad = int(request.POST.get('cantidad', 1))
        
        if cantidad > 0:
            item.cantidad = cantidad
            item.save()
        else:
            item.delete()
    
    return redirect('carrito')

def inicio(request):
    return render(request, 'inicio.html')

def productos(request):
    productos = Producto.objects.all()[:6] 
    context = {
        'productos': productos
    }
    return render(request, 'productos.html', context)
