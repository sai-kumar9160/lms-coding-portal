import java.io.*;
import java.nio.file.*;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.function.*;
import java.util.regex.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;
import java.time.*;
import java.time.format.DateTimeFormatter;
import java.sql.*;

public class Demo {
    static abstract class Payment {
        abstract void pay(int amount);
    }
    static class CardPayment extends Payment {
        @Override void pay(int amount) {
            System.out.println("Card paid: " + amount);
        }
    }

    public static void main(String[] args) throws Exception {
        Payment payment = new CardPayment();
        payment.pay(250);
    }
}
