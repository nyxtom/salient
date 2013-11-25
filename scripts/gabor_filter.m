function img_out_disp=gabor_filter(img_in,lambda,theta,gamma,bw,psi,N)

if (size(size(img_in),2) == 3)
img_in=img_in(:,:,2);
endif

img_in = double(img_in);
img_out = zeros(size(img_in,1),size(img_in,2),N);
for n=1:N
    gb = gabor_fn(bw,theta,lambda,psi(1),gamma) + 1i * gabor_fn(bw,theta,lambda,psi(2),gamma);
    img_out(:,:,n) = imfilter(img_in,gb,'symmetric');
    img_out(:,:,n) = sum(abs(img_out(:,:,n)).^2,3).^0.5;
    theta = theta + 2 * pi/N;
endfor

img_out_disp = img_out./max(img_out(:));
imshow(img_out_disp);
